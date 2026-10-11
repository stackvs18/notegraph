import logging
from collections import Counter

from rest_framework.views import APIView
from rest_framework.response import Response

from .services import fetch_admin_public_notes, build_graph

logger = logging.getLogger(__name__)


class HealthCheckView(APIView):
    def get(self, request):
        return Response({"status": "ok", "service": "django"})


class GraphDataView(APIView):
    """
    Returns graph data (nodes and edges) formatted for D3 visualization.
    Gracefully degrades to empty nodes and edges on error.
    """
    def get(self, request):
        try:
            notes = fetch_admin_public_notes()
            G = build_graph(notes)

            nodes = []
            for node_id, data in G.nodes(data=True):
                nodes.append({
                    "id": str(node_id),
                    "title": data.get("title", ""),
                    "tags": data.get("tags", []),
                    "authorName": data.get("authorName", ""),
                    "slug": data.get("slug", ""),
                    "nanoid": data.get("nanoid", ""),
                    "degree": G.degree(node_id),
                })

            edges = []
            for u, v, data in G.edges(data=True):
                edges.append({
                    "source": str(u),
                    "target": str(v),
                    "weight": data.get("weight", 1),
                })

            return Response({"nodes": nodes, "edges": edges}, status=200)
        except Exception as e:
            logger.error("Error in GraphDataView: %s", e, exc_info=True)
            return Response({"nodes": [], "edges": []}, status=200)


class GraphStatsView(APIView):
    """
    Returns statistical summary of the graph (total nodes, total edges,
    most connected node, top 5 tags across all notes, and untagged notes count).
    Gracefully degrades to zeroed/empty stats on error.
    """
    def get(self, request):
        try:
            notes = fetch_admin_public_notes()
            G = build_graph(notes)

            total_nodes = G.number_of_nodes()
            total_edges = G.number_of_edges()
            untagged_notes_count = G.graph.get("untagged_notes_count")

            if total_nodes == 0:
                most_connected = None
            else:
                max_node_id, _ = max(G.degree, key=lambda x: x[1])
                node_data = G.nodes[max_node_id]
                most_connected = {
                    "id": str(max_node_id),
                    "title": node_data.get("title", ""),
                }

            tag_counts = Counter()
            for note in notes:
                tags = note.get("tags", [])
                if isinstance(tags, list):
                    for t in tags:
                        if isinstance(t, str) and t.strip():
                            tag_counts[t.strip()] += 1

            top_tags = []
            for tag, count in tag_counts.most_common(5):
                top_tags.append({"tag": tag, "count": count})

            return Response({
                "total_nodes": total_nodes,
                "total_edges": total_edges,
                "most_connected": most_connected,
                "top_tags": top_tags,
                "untagged_notes_count": untagged_notes_count,
            }, status=200)
        except Exception as e:
            logger.error("Error in GraphStatsView: %s", e, exc_info=True)
            return Response({
                "total_nodes": 0,
                "total_edges": 0,
                "most_connected": None,
                "top_tags": [],
                "untagged_notes_count": 0,
            }, status=200)
