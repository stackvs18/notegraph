import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getGraphData, getGraphStats } from '../api/graph';
import GraphCanvas from '../components/GraphCanvas';

// Renders the interactive Knowledge Graph page with filtering sidebar, stats panel, and D3 canvas
export default function Graph() {
  const navigate = useNavigate();

  const nodesState = React.useState([]);
  const nodes = nodesState[0];
  const setNodes = nodesState[1];

  const edgesState = React.useState([]);
  const edges = edgesState[0];
  const setEdges = edgesState[1];

  const graphStatsState = React.useState(null);
  const graphStats = graphStatsState[0];
  const setGraphStats = graphStatsState[1];

  const isLoadingState = React.useState(true);
  const isLoading = isLoadingState[0];
  const setIsLoading = isLoadingState[1];

  const errorMessageState = React.useState('');
  const errorMessage = errorMessageState[0];
  const setErrorMessage = errorMessageState[1];

  const visibleTagsState = React.useState(new Set());
  const visibleTags = visibleTagsState[0];
  const setVisibleTags = visibleTagsState[1];

  const currentlyHoveredNodeState = React.useState(null);
  const currentlyHoveredNode = currentlyHoveredNodeState[0];
  const setCurrentlyHoveredNode = currentlyHoveredNodeState[1];

  const mousePositionXState = React.useState(0);
  const mousePositionX = mousePositionXState[0];
  const setMousePositionX = mousePositionXState[1];

  const mousePositionYState = React.useState(0);
  const mousePositionY = mousePositionYState[0];
  const setMousePositionY = mousePositionYState[1];

  // Fetches node/edge data and summary statistics from the Django Graph REST API
  async function loadGraphDataAndStats() {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const graphDataResponse = await getGraphData();
      const graphStatsResponse = await getGraphStats();

      let fetchedNodesList = [];
      if (graphDataResponse.nodes !== null && graphDataResponse.nodes !== undefined) {
        fetchedNodesList = graphDataResponse.nodes;
      }

      let fetchedEdgesList = [];
      if (graphDataResponse.edges !== null && graphDataResponse.edges !== undefined) {
        fetchedEdgesList = graphDataResponse.edges;
      }

      setNodes(fetchedNodesList);
      setEdges(fetchedEdgesList);
      setGraphStats(graphStatsResponse);

      // Compute unique tags to populate initial visibleTags Set
      const uniqueTagsList = [];
      for (let nodeIndex = 0; nodeIndex < fetchedNodesList.length; nodeIndex = nodeIndex + 1) {
        const currentNoteNode = fetchedNodesList[nodeIndex];
        if (currentNoteNode.tags !== null && currentNoteNode.tags !== undefined) {
          for (let tagIndex = 0; tagIndex < currentNoteNode.tags.length; tagIndex = tagIndex + 1) {
            const currentTagString = currentNoteNode.tags[tagIndex];
            let isAlreadyInList = false;

            for (let checkIndex = 0; checkIndex < uniqueTagsList.length; checkIndex = checkIndex + 1) {
              if (uniqueTagsList[checkIndex] === currentTagString) {
                isAlreadyInList = true;
                break;
              }
            }

            if (isAlreadyInList === false) {
              uniqueTagsList.push(currentTagString);
            }
          }
        }
      }

      const initialVisibleTagsSet = new Set();
      for (let tagIndex = 0; tagIndex < uniqueTagsList.length; tagIndex = tagIndex + 1) {
        initialVisibleTagsSet.add(uniqueTagsList[tagIndex]);
      }
      setVisibleTags(initialVisibleTagsSet);

      setIsLoading(false);
    } catch (fetchError) {
      setIsLoading(false);
      setErrorMessage('Failed to load graph data. Please try again.');
    }
  }

  // Effect hook to load graph data on initial page mount
  React.useEffect(function () {
    loadGraphDataAndStats();
  }, []);

  // Compute all unique tags and tag counts across loaded nodes
  const allUniqueTagsList = [];
  const tagNodeCountsObject = {};

  for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex = nodeIndex + 1) {
    const currentNoteNode = nodes[nodeIndex];
    if (currentNoteNode.tags !== null && currentNoteNode.tags !== undefined) {
      for (let tagIndex = 0; tagIndex < currentNoteNode.tags.length; tagIndex = tagIndex + 1) {
        const currentTagString = currentNoteNode.tags[tagIndex];

        let isAlreadyInList = false;
        for (let checkIndex = 0; checkIndex < allUniqueTagsList.length; checkIndex = checkIndex + 1) {
          if (allUniqueTagsList[checkIndex] === currentTagString) {
            isAlreadyInList = true;
            break;
          }
        }

        if (isAlreadyInList === false) {
          allUniqueTagsList.push(currentTagString);
        }

        if (tagNodeCountsObject[currentTagString] !== null && tagNodeCountsObject[currentTagString] !== undefined) {
          tagNodeCountsObject[currentTagString] = tagNodeCountsObject[currentTagString] + 1;
        } else {
          tagNodeCountsObject[currentTagString] = 1;
        }
      }
    }
  }

  // Selects all available tags so every tag is visible in the graph
  function handleSelectAllTags() {
    const allTagsSet = new Set();
    for (let tagIndex = 0; tagIndex < allUniqueTagsList.length; tagIndex = tagIndex + 1) {
      allTagsSet.add(allUniqueTagsList[tagIndex]);
    }
    setVisibleTags(allTagsSet);
  }

  // Clears all tag selections so no nodes are visible
  function handleClearAllTags() {
    const emptyTagsSet = new Set();
    setVisibleTags(emptyTagsSet);
  }

  // Toggles visibility of a specific tag when its checkbox is clicked
  function handleToggleTag(tagName) {
    const newVisibleTagsSet = new Set();
    visibleTags.forEach(function (existingTag) {
      newVisibleTagsSet.add(existingTag);
    });

    if (newVisibleTagsSet.has(tagName)) {
      newVisibleTagsSet.delete(tagName);
    } else {
      newVisibleTagsSet.add(tagName);
    }
    setVisibleTags(newVisibleTagsSet);
  }

  // Navigates to the note detail page when a graph node circle is clicked
  // Wrapped in useCallback so the function identity stays stable across renders.
  var handleNodeClick = React.useCallback(function handleNodeClick(clickedNode) {
    if (clickedNode !== null && clickedNode !== undefined) {
      var noteSlugString = clickedNode.slug;
      if (noteSlugString === null || noteSlugString === undefined || noteSlugString === '') {
        noteSlugString = 'note';
      }

      var noteIdString = clickedNode.nanoid;
      if (noteIdString === null || noteIdString === undefined || noteIdString === '') {
        noteIdString = clickedNode.id;
      }

      navigate('/notes/' + noteSlugString + '/' + noteIdString);
    }
  }, [navigate]);

  // Updates state when mouse hovers over a graph node circle
  var handleNodeHover = React.useCallback(function handleNodeHover(hoveredNode) {
    setCurrentlyHoveredNode(hoveredNode);
  }, []);

  // Updates mouse coordinates state on mouse movement over the graph canvas area
  var handleMouseMove = React.useCallback(function handleMouseMove(mouseEvent) {
    setMousePositionX(mouseEvent.clientX);
    setMousePositionY(mouseEvent.clientY);
  }, []);

  // Render Step 2: Loading state
  if (isLoading === true) {
    return (
      <div
        style={{
          paddingTop: '72px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif",
          color: '#6E6E73',
          fontSize: '16px',
        }}
      >
        Loading graph...
      </div>
    );
  }

  // Render Step 3: Error state with Retry button
  if (errorMessage !== null && errorMessage !== undefined && errorMessage !== '') {
    return (
      <div
        style={{
          paddingTop: '72px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif",
        }}
      >
        <div style={{ color: '#FF3B30', fontSize: '16px', marginBottom: '16px' }}>
          {errorMessage}
        </div>
        <button
          onClick={function () {
            loadGraphDataAndStats();
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007AFF',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Render Step 4: Empty graph state
  if (nodes.length === 0) {
    return (
      <div
        style={{
          paddingTop: '72px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif",
          color: '#6E6E73',
          fontSize: '16px',
        }}
      >
        No public knowledge graph data yet.
      </div>
    );
  }

  // Build sidebar checkbox elements using a plain for loop
  const checkboxElementsList = [];
  for (let tagIndex = 0; tagIndex < allUniqueTagsList.length; tagIndex = tagIndex + 1) {
    const currentTagName = allUniqueTagsList[tagIndex];
    const currentTagCount = tagNodeCountsObject[currentTagName];
    const isCheckedBool = visibleTags.has(currentTagName);

    checkboxElementsList.push(
      <label
        key={currentTagName}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          color: '#1D1D1F',
        }}
      >
        <input
          type="checkbox"
          checked={isCheckedBool}
          onChange={function () {
            handleToggleTag(currentTagName);
          }}
        />
        <span>{currentTagName} ({currentTagCount})</span>
      </label>
    );
  }

  // Build stats panel data and elements
  let totalNodesCountNumber = 0;
  if (graphStats !== null && graphStats !== undefined) {
    if (graphStats.total_nodes !== null && graphStats.total_nodes !== undefined) {
      totalNodesCountNumber = graphStats.total_nodes;
    }
  }

  let totalEdgesCountNumber = 0;
  if (graphStats !== null && graphStats !== undefined) {
    if (graphStats.total_edges !== null && graphStats.total_edges !== undefined) {
      totalEdgesCountNumber = graphStats.total_edges;
    }
  }

  let mostConnectedTitleString = 'N/A';
  if (graphStats !== null && graphStats !== undefined) {
    if (graphStats.most_connected !== null && graphStats.most_connected !== undefined) {
      if (graphStats.most_connected.title !== null && graphStats.most_connected.title !== undefined) {
        mostConnectedTitleString = graphStats.most_connected.title;
      }
    }
  }

  let untaggedNotesCountNumber = 0;
  if (graphStats !== null && graphStats !== undefined) {
    if (graphStats.untagged_notes_count !== null && graphStats.untagged_notes_count !== undefined) {
      untaggedNotesCountNumber = graphStats.untagged_notes_count;
    }
  }

  const topTagElementsList = [];
  if (graphStats !== null && graphStats !== undefined) {
    if (graphStats.top_tags !== null && graphStats.top_tags !== undefined) {
      for (let topTagIndex = 0; topTagIndex < graphStats.top_tags.length; topTagIndex = topTagIndex + 1) {
        const topTagObject = graphStats.top_tags[topTagIndex];
        topTagElementsList.push(
          <div key={topTagObject.tag} style={{ fontSize: '13px', color: '#1D1D1F', marginTop: '2px' }}>
            {topTagObject.tag} ({topTagObject.count})
          </div>
        );
      }
    }
  }

  // Build floating tooltip element if a node is currently hovered
  let tooltipElement = null;
  if (currentlyHoveredNode !== null && currentlyHoveredNode !== undefined) {
    let nodeTagsJoinedString = '';
    if (currentlyHoveredNode.tags !== null && currentlyHoveredNode.tags !== undefined) {
      for (let tagIdx = 0; tagIdx < currentlyHoveredNode.tags.length; tagIdx = tagIdx + 1) {
        if (tagIdx > 0) {
          nodeTagsJoinedString = nodeTagsJoinedString + ', ';
        }
        nodeTagsJoinedString = nodeTagsJoinedString + currentlyHoveredNode.tags[tagIdx];
      }
    }

    tooltipElement = (
      <div
        style={{
          position: 'fixed',
          left: (mousePositionX + 12) + 'px',
          top: (mousePositionY + 12) + 'px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E5E7',
          borderRadius: '6px',
          padding: '8px 12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          pointerEvents: 'none',
          zIndex: 1000,
          fontSize: '12px',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif",
        }}
      >
        <div style={{ fontWeight: '600', color: '#1D1D1F', marginBottom: '2px' }}>
          {currentlyHoveredNode.title}
        </div>
        <div style={{ color: '#6E6E73', marginBottom: '2px' }}>
          Tags: {nodeTagsJoinedString}
        </div>
        <div style={{ color: '#6E6E73' }}>
          Degree: {currentlyHoveredNode.degree}
        </div>
      </div>
    );
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      style={{
        paddingTop: '72px',
        display: 'flex',
        height: '100vh',
        boxSizing: 'border-box',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif",
        backgroundColor: '#FAFAFA',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Step 7: Left Sidebar */}
      <div
        style={{
          width: '220px',
          minWidth: '220px',
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #E5E5E7',
          padding: '16px',
          boxSizing: 'border-box',
          overflowY: 'auto',
        }}
      >
        <div style={{ fontWeight: '600', fontSize: '16px', color: '#1D1D1F', marginBottom: '12px' }}>
          Filter Tags
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
          <span
            onClick={handleSelectAllTags}
            style={{ color: '#007AFF', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
          >
            Select all
          </span>
          <span
            onClick={handleClearAllTags}
            style={{ color: '#007AFF', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
          >
            Clear all
          </span>
        </div>

        <div>
          {checkboxElementsList}
        </div>
      </div>

      {/* Step 8: Main Graph Area */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          height: '100%',
          width: '100%',
          backgroundColor: '#FFFFFF',
        }}
      >
        <GraphCanvas
          nodes={nodes}
          edges={edges}
          visibleTags={visibleTags}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
        />

        {/* Step 10: Stats Panel */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            backgroundColor: '#F5F5F7',
            border: '1px solid #E5E5E7',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '13px',
            color: '#1D1D1F',
            maxWidth: '240px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
            zIndex: 10,
          }}
        >
          <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
            Graph Statistics
          </div>
          <div style={{ marginBottom: '4px' }}>
            Total nodes: {totalNodesCountNumber}
          </div>
          <div style={{ marginBottom: '4px' }}>
            Total edges: {totalEdgesCountNumber}
          </div>
          <div style={{ marginBottom: '4px' }}>
            Most connected: {mostConnectedTitleString}
          </div>
          <div style={{ marginBottom: '8px' }}>
            Notes without tags (hidden): {untaggedNotesCountNumber}
          </div>

          <div style={{ fontWeight: '600', marginTop: '8px', marginBottom: '4px' }}>
            Top tags:
          </div>
          <div>
            {topTagElementsList}
          </div>
        </div>

        {/* Step 9: Tooltip */}
        {tooltipElement}
      </div>
    </div>
  );
}
