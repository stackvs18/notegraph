from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from unittest.mock import patch, MagicMock
import requests

from graph.services import fetch_admin_public_notes, build_graph


class GraphServicesTest(TestCase):
    @patch("graph.services.requests.get")
    def test_fetch_admin_public_notes_success(self, mock_get):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "notes": [
                {
                    "_id": "note1",
                    "title": "Admin Note 1",
                    "tags": ["python", "django"],
                    "authorName": "admin",
                    "isPermanent": True,
                    "visibility": "public",
                },
                {
                    "_id": "note2",
                    "title": "User Note 1",
                    "tags": ["python"],
                    "authorName": "user1",
                    "isPermanent": False,
                    "visibility": "public",
                },
                {
                    "_id": "note3",
                    "title": "Admin Note 2",
                    "tags": ["django", "react"],
                    "authorName": "admin",
                    "isPermanent": True,
                    "visibility": "public",
                },
            ]
        }
        mock_get.return_value = mock_response

        notes = fetch_admin_public_notes()
        self.assertEqual(len(notes), 2)
        titles = [n["title"] for n in notes]
        self.assertIn("Admin Note 1", titles)
        self.assertIn("Admin Note 2", titles)
        self.assertNotIn("User Note 1", titles)

    @patch("graph.services.requests.get")
    def test_fetch_admin_public_notes_failure(self, mock_get):
        mock_get.side_effect = requests.exceptions.RequestException("Connection refused")
        notes = fetch_admin_public_notes()
        self.assertEqual(notes, [])

    @patch("graph.services.requests.get")
    def test_fetch_admin_public_notes_non_200(self, mock_get):
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_get.return_value = mock_response

        notes = fetch_admin_public_notes()
        self.assertEqual(notes, [])

    def test_build_graph_empty(self):
        g = build_graph([])
        self.assertEqual(g.number_of_nodes(), 0)
        self.assertEqual(g.number_of_edges(), 0)

    def test_build_graph_with_notes(self):
        notes = [
            {
                "_id": "note1",
                "title": "Note 1",
                "tags": ["Python", "Django"],
                "authorName": "admin",
            },
            {
                "_id": "note2",
                "title": "Note 2",
                "tags": ["django", "React"],
                "authorName": "admin",
            },
            {
                "_id": "note3",
                "title": "Note 3",
                "tags": ["Vue"],
                "authorName": "admin",
            },
        ]
        g = build_graph(notes)
        self.assertEqual(g.number_of_nodes(), 3)
        self.assertEqual(g.number_of_edges(), 1)
        self.assertTrue(g.has_edge("note1", "note2"))
        self.assertEqual(g["note1"]["note2"]["weight"], 1)

        # Check node data
        self.assertEqual(g.nodes["note1"]["title"], "Note 1")
        self.assertEqual(g.nodes["note1"]["authorName"], "admin")
        self.assertEqual(g.nodes["note1"]["tags"], ["Python", "Django"])


class GraphViewsTest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_health_check_view(self):
        response = self.client.get('/api/graph/health/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok", "service": "django"})

    @patch("graph.views.fetch_admin_public_notes")
    def test_graph_data_view_success(self, mock_fetch):
        mock_fetch.return_value = [
            {
                "_id": "n1",
                "title": "Note One",
                "tags": ["python", "django"],
                "authorName": "admin",
                "isPermanent": True,
            },
            {
                "_id": "n2",
                "title": "Note Two",
                "tags": ["django"],
                "authorName": "admin",
                "isPermanent": True,
            },
        ]

        response = self.client.get('/api/graph/')
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertIn("nodes", data)
        self.assertIn("edges", data)
        self.assertEqual(len(data["nodes"]), 2)
        self.assertEqual(len(data["edges"]), 1)

        # Check degree in node attributes
        node_dict = {n["id"]: n for n in data["nodes"]}
        self.assertEqual(node_dict["n1"]["degree"], 1)
        self.assertEqual(node_dict["n1"]["title"], "Note One")
        self.assertEqual(node_dict["n2"]["degree"], 1)

        # Check edge
        edge = data["edges"][0]
        self.assertEqual(edge["weight"], 1)
        self.assertTrue((edge["source"] == "n1" and edge["target"] == "n2") or
                        (edge["source"] == "n2" and edge["target"] == "n1"))

    @patch("graph.views.fetch_admin_public_notes")
    def test_graph_data_view_exception_handling(self, mock_fetch):
        mock_fetch.side_effect = Exception("Backend breakdown")
        response = self.client.get('/api/graph/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"nodes": [], "edges": []})

    @patch("graph.views.fetch_admin_public_notes")
    def test_graph_stats_view_success(self, mock_fetch):
        mock_fetch.return_value = [
            {
                "_id": "n1",
                "title": "Hub Note",
                "tags": ["tagA", "tagB", "tagC"],
                "authorName": "admin",
                "isPermanent": True,
            },
            {
                "_id": "n2",
                "title": "Spoke 1",
                "tags": ["tagA"],
                "authorName": "admin",
                "isPermanent": True,
            },
            {
                "_id": "n3",
                "title": "Spoke 2",
                "tags": ["tagB"],
                "authorName": "admin",
                "isPermanent": True,
            },
        ]

        response = self.client.get('/api/graph/stats/')
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertEqual(data["total_nodes"], 3)
        self.assertEqual(data["total_edges"], 2)
        self.assertEqual(data["most_connected"], {"id": "n1", "title": "Hub Note"})
        
        # Check top tags
        top_tags = data["top_tags"]
        self.assertTrue(len(top_tags) <= 5)
        # tagA appears in n1 and n2 (count 2), tagB appears in n1 and n3 (count 2), tagC in n1 (count 1)
        tag_dict = {item["tag"]: item["count"] for item in top_tags}
        self.assertEqual(tag_dict["tagA"], 2)
        self.assertEqual(tag_dict["tagB"], 2)
        self.assertEqual(tag_dict["tagC"], 1)

    @patch("graph.views.fetch_admin_public_notes")
    def test_graph_stats_view_empty(self, mock_fetch):
        mock_fetch.return_value = []
        response = self.client.get('/api/graph/stats/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {
            "total_nodes": 0,
            "total_edges": 0,
            "most_connected": None,
            "top_tags": [],
            "untagged_notes_count": 0,
        })

    @patch("graph.views.fetch_admin_public_notes")
    def test_graph_stats_view_exception_handling(self, mock_fetch):
        mock_fetch.side_effect = Exception("Backend breakdown")
        response = self.client.get('/api/graph/stats/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {
            "total_nodes": 0,
            "total_edges": 0,
            "most_connected": None,
            "top_tags": [],
            "untagged_notes_count": 0,
        })

    def test_build_graph_excludes_untagged_notes(self):
        notes = [
            {"_id": "n1", "title": "Tagged Note", "tags": ["python"], "authorName": "admin"},
            {"_id": "n2", "title": "Untagged Note 1", "tags": [], "authorName": "admin"},
            {"_id": "n3", "title": "Untagged Note 2", "tags": None, "authorName": "admin"},
        ]
        g = build_graph(notes)
        self.assertEqual(g.number_of_nodes(), 1)
        self.assertTrue(g.has_node("n1"))
        self.assertFalse(g.has_node("n2"))
        self.assertFalse(g.has_node("n3"))
        self.assertEqual(g.graph.get("untagged_notes_count"), 2)
