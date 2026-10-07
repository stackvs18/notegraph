import requests
import networkx as nx
from django.conf import settings


def fetch_admin_public_notes():
    """
    Fetches public notes from the Express backend API and filters them to return
    only permanent admin notes. Gracefully handles errors by returning an empty list.
    """
    url = f"{settings.EXPRESS_API_URL}/notes/public"
    try:
        # Long timeout: a sleeping free-tier Express instance can take ~50s to wake
        response = requests.get(url, timeout=50)
        if response.status_code != 200:
            return []
        
        data = response.json()
        notes = data.get("notes", [])
        if not isinstance(notes, list):
            return []

        # Filter to only permanent admin notes per spec
        admin_notes = []
        for note in notes:
            if note.get("isPermanent") is True:
                admin_notes.append(note)
        return admin_notes
    except Exception:
        return []


def build_graph(notes):
    """
    Builds an undirected NetworkX graph from a list of note dictionaries.
    Nodes represent notes with title, tags, and authorName attributes.
    Edges connect notes that share at least one tag, weighted by shared tag count.
    """
    G = nx.Graph()
    untagged_notes_count = 0

    if not notes:
        G.graph["untagged_notes_count"] = untagged_notes_count
        return G

    # Filter out untagged notes using a plain for loop
    tagged_notes = []
    for note in notes:
        note_tags = note.get("tags", [])
        if note_tags is None:
            note_tags = []

        if len(note_tags) == 0:
            untagged_notes_count = untagged_notes_count + 1
        else:
            tagged_notes.append(note)

    for note in tagged_notes:
        note_id = note.get("_id") or note.get("id")
        if not note_id:
            continue

        G.add_node(
            note_id,
            title=note.get("title", ""),
            tags=note.get("tags", []),
            authorName=note.get("authorName", ""),
            slug=note.get("slug", ""),
            nanoid=note.get("nanoid", ""),
        )

    num_notes = len(tagged_notes)
    for i in range(num_notes):
        for j in range(i + 1, num_notes):
            note_i = tagged_notes[i]
            note_j = tagged_notes[j]
            id_i = note_i.get("_id") or note_i.get("id")
            id_j = note_j.get("_id") or note_j.get("id")

            if not id_i or not id_j or id_i == id_j:
                continue

            tags_i_raw = note_i.get("tags", [])
            if tags_i_raw is None:
                tags_i_raw = []
            tags_i = set()
            for t in tags_i_raw:
                if isinstance(t, str):
                    tags_i.add(t.lower())

            tags_j_raw = note_j.get("tags", [])
            if tags_j_raw is None:
                tags_j_raw = []
            tags_j = set()
            for t in tags_j_raw:
                if isinstance(t, str):
                    tags_j.add(t.lower())

            shared_tags = tags_i & tags_j
            if len(shared_tags) > 0:
                G.add_edge(id_i, id_j, weight=len(shared_tags))

    G.graph["untagged_notes_count"] = untagged_notes_count
    return G
