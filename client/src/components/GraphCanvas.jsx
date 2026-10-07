import React from 'react';
import * as d3 from 'd3';

// Calculates the node radius based on degree: base 6 + degree * 2, capped at 20
function calculateNodeSize(degreeValue) {
  var nodeDegreeNumber = 0;
  if (degreeValue !== null && degreeValue !== undefined) {
    nodeDegreeNumber = degreeValue;
  }

  var calculatedSize = 6 + (nodeDegreeNumber * 2);
  if (calculatedSize > 20) {
    calculatedSize = 20;
  }
  return calculatedSize;
}

// Renders an interactive D3 force-directed graph canvas component inside an SVG element
// Styled like Obsidian's graph view — monochrome, clean, no bright tag colors
export default function GraphCanvas(props) {
  var svgRef = React.useRef(null);

  // Store the simulation in a ref so we can stop it reliably between renders
  var simulationRef = React.useRef(null);

  // Store callback refs so the D3 event handlers always call the latest version
  // without needing them in the useEffect dependency array (which would cause
  // the simulation to be destroyed and recreated on every render — the jitter bug).
  var onNodeClickRef = React.useRef(null);
  var onNodeHoverRef = React.useRef(null);

  // Keep the refs up to date on every render (this is cheap, no side effects)
  onNodeClickRef.current = props.onNodeClick;
  onNodeHoverRef.current = props.onNodeHover;

  // Serialize visibleTags into a stable string so the useEffect dependency
  // only changes when the actual tag set changes, not when a new Set object
  // is created with the same contents.
  var visibleTagsKey = '';
  if (props.visibleTags !== null && props.visibleTags !== undefined) {
    var tagArray = [];
    props.visibleTags.forEach(function (tag) {
      tagArray.push(tag);
    });
    tagArray.sort();
    visibleTagsKey = tagArray.join(',');
  }

  React.useEffect(function () {
    // ---- STEP 1: Stop any previous simulation before building a new one ----
    // This prevents two simulations running at the same time and fighting
    // over node positions (another cause of jitter).
    if (simulationRef.current !== null) {
      simulationRef.current.stop();
      simulationRef.current = null;
    }

    // ---- STEP 2: Read input data from props ----
    var inputNodesList = [];
    if (props.nodes !== null && props.nodes !== undefined) {
      inputNodesList = props.nodes;
    }

    var inputEdgesList = [];
    if (props.edges !== null && props.edges !== undefined) {
      inputEdgesList = props.edges;
    }

    var inputVisibleTagsSet = new Set();
    if (props.visibleTags !== null && props.visibleTags !== undefined) {
      inputVisibleTagsSet = props.visibleTags;
    }

    // ---- STEP 3: Filter nodes based on visibleTags ----
    var filteredNodesList = [];
    var survivingNodeIdSet = new Set();

    for (var nodeIndex = 0; nodeIndex < inputNodesList.length; nodeIndex = nodeIndex + 1) {
      var currentNoteNode = inputNodesList[nodeIndex];
      var shouldIncludeNode = false;

      if (currentNoteNode.tags !== null && currentNoteNode.tags !== undefined) {
        for (var tagIndex = 0; tagIndex < currentNoteNode.tags.length; tagIndex = tagIndex + 1) {
          var currentTagString = currentNoteNode.tags[tagIndex];
          if (inputVisibleTagsSet.has(currentTagString)) {
            shouldIncludeNode = true;
            break;
          }
        }
      }

      if (shouldIncludeNode === true) {
        var nodeCopyObject = {
          id: currentNoteNode.id,
          title: currentNoteNode.title,
          tags: currentNoteNode.tags,
          authorName: currentNoteNode.authorName,
          slug: currentNoteNode.slug,
          nanoid: currentNoteNode.nanoid,
          degree: currentNoteNode.degree,
          size: calculateNodeSize(currentNoteNode.degree),
        };

        filteredNodesList.push(nodeCopyObject);
        survivingNodeIdSet.add(currentNoteNode.id);
      }
    }

    // ---- STEP 4: Filter edges keeping only those where both endpoints survived ----
    var filteredEdgesList = [];

    for (var edgeIndex = 0; edgeIndex < inputEdgesList.length; edgeIndex = edgeIndex + 1) {
      var currentEdgeObject = inputEdgesList[edgeIndex];

      var sourceIdString = currentEdgeObject.source;
      if (typeof currentEdgeObject.source === 'object' && currentEdgeObject.source !== null) {
        sourceIdString = currentEdgeObject.source.id;
      }

      var targetIdString = currentEdgeObject.target;
      if (typeof currentEdgeObject.target === 'object' && currentEdgeObject.target !== null) {
        targetIdString = currentEdgeObject.target.id;
      }

      if (survivingNodeIdSet.has(sourceIdString) && survivingNodeIdSet.has(targetIdString)) {
        var edgeCopyObject = {
          source: sourceIdString,
          target: targetIdString,
          weight: currentEdgeObject.weight,
        };
        filteredEdgesList.push(edgeCopyObject);
      }
    }

    // ---- STEP 5: Clear the SVG and measure its real rendered size ----
    var svgElement = svgRef.current;
    if (svgElement === null || svgElement === undefined) {
      return;
    }

    var svgD3Selection = d3.select(svgElement);
    svgD3Selection.selectAll('*').remove();

    var svgBoundingBox = svgElement.getBoundingClientRect();
    var svgContainerWidth = svgBoundingBox.width;
    if (svgContainerWidth === 0) {
      svgContainerWidth = 800;
    }

    var svgContainerHeight = svgBoundingBox.height;
    if (svgContainerHeight === 0) {
      svgContainerHeight = 600;
    }

    // If there are no nodes to draw, stop here
    if (filteredNodesList.length === 0) {
      return;
    }

    // ---- STEP 6: Create the D3 force simulation ----
    var forceSimulation = d3.forceSimulation(filteredNodesList)
      .force('link', d3.forceLink(filteredEdgesList).id(function (nodeItem) {
        return nodeItem.id;
      }).distance(140))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(svgContainerWidth / 2, svgContainerHeight / 2))
      .force('collide', d3.forceCollide(function (nodeItem) {
        return nodeItem.size + 12;
      }));

    // Store in ref so we can stop it on next render or unmount
    simulationRef.current = forceSimulation;

    // Create a container group for zoom/pan
    var svgContainerGroup = svgD3Selection.append('g');

    // Add zoom behavior
    var zoomBehavior = d3.zoom()
      .scaleExtent([0.3, 3])
      .on('zoom', function (zoomEvent) {
        svgContainerGroup.attr('transform', zoomEvent.transform);
      });

    svgD3Selection.call(zoomBehavior);

    // ---- STEP 7: Draw edge lines (thin, light gray — Obsidian style) ----
    var edgeLineElements = svgContainerGroup
      .append('g')
      .selectAll('line')
      .data(filteredEdgesList)
      .enter()
      .append('line')
      .attr('stroke', function (edgeItem) {
        var edgeWeightValue = 1;
        if (edgeItem.weight !== null && edgeItem.weight !== undefined) {
          edgeWeightValue = edgeItem.weight;
        }
        // Slightly darker gray for heavier edges
        if (edgeWeightValue > 1) {
          return '#D1D1D6';
        }
        return '#E5E5E7';
      })
      .attr('stroke-width', function (edgeItem) {
        var edgeWeightValue = 1;
        if (edgeItem.weight !== null && edgeItem.weight !== undefined) {
          edgeWeightValue = edgeItem.weight;
        }
        return 0.8 + (edgeWeightValue * 0.4);
      });

    // ---- STEP 8: Create a group per node (circle + label) ----
    var nodeGroupElements = svgContainerGroup
      .append('g')
      .selectAll('g')
      .data(filteredNodesList)
      .enter()
      .append('g')
      .attr('cursor', 'pointer');

    // Draw circles — monochrome dark fill, like Obsidian
    nodeGroupElements
      .append('circle')
      .attr('r', function (nodeItem) {
        return nodeItem.size;
      })
      .attr('fill', '#1D1D1F')
      .attr('stroke', '#FFFFFF')
      .attr('stroke-width', 1.5)
      .attr('class', 'graph-node-circle');

    // Draw title labels next to each node — small, dark text
    nodeGroupElements
      .append('text')
      .text(function (nodeItem) {
        return nodeItem.title;
      })
      .attr('dx', function (nodeItem) {
        return nodeItem.size + 6;
      })
      .attr('dy', 4)
      .attr('font-size', '11px')
      .attr('font-family', "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif")
      .attr('fill', '#1D1D1F')
      .attr('pointer-events', 'none');

    // ---- STEP 9: Set up D3 drag behavior ----
    function handleDragStart(dragEvent, nodeItem) {
      if (!dragEvent.active) {
        forceSimulation.alphaTarget(0.3).restart();
      }
      nodeItem.fx = nodeItem.x;
      nodeItem.fy = nodeItem.y;
    }

    function handleDragging(dragEvent, nodeItem) {
      nodeItem.fx = dragEvent.x;
      nodeItem.fy = dragEvent.y;
    }

    function handleDragEnd(dragEvent, nodeItem) {
      if (!dragEvent.active) {
        forceSimulation.alphaTarget(0);
      }
      nodeItem.fx = null;
      nodeItem.fy = null;
    }

    var nodeDragBehavior = d3.drag()
      .on('start', handleDragStart)
      .on('drag', handleDragging)
      .on('end', handleDragEnd);

    nodeGroupElements.call(nodeDragBehavior);

    // ---- STEP 10: Hover and click event handlers ----
    // We read from refs so we always call the latest callback version
    // without including the callbacks in the useEffect dependency array.
    nodeGroupElements
      .on('mouseenter', function (pointerEvent, nodeItem) {
        // Highlight the hovered node circle with accent blue
        d3.select(this).select('circle')
          .attr('fill', '#007AFF')
          .attr('stroke', '#007AFF')
          .attr('stroke-width', 2.5);

        // Make the label bolder on hover
        d3.select(this).select('text')
          .attr('font-weight', '600');

        if (onNodeHoverRef.current !== null && onNodeHoverRef.current !== undefined) {
          onNodeHoverRef.current(nodeItem);
        }
      })
      .on('mouseleave', function () {
        // Reset node circle to default monochrome style
        d3.select(this).select('circle')
          .attr('fill', '#1D1D1F')
          .attr('stroke', '#FFFFFF')
          .attr('stroke-width', 1.5);

        // Reset label weight
        d3.select(this).select('text')
          .attr('font-weight', 'normal');

        if (onNodeHoverRef.current !== null && onNodeHoverRef.current !== undefined) {
          onNodeHoverRef.current(null);
        }
      })
      .on('click', function (pointerEvent, nodeItem) {
        if (onNodeClickRef.current !== null && onNodeClickRef.current !== undefined) {
          onNodeClickRef.current(nodeItem);
        }
      });

    // ---- STEP 11: Update positions on each simulation tick ----
    forceSimulation.on('tick', function () {
      edgeLineElements
        .attr('x1', function (edgeItem) {
          return edgeItem.source.x;
        })
        .attr('y1', function (edgeItem) {
          return edgeItem.source.y;
        })
        .attr('x2', function (edgeItem) {
          return edgeItem.target.x;
        })
        .attr('y2', function (edgeItem) {
          return edgeItem.target.y;
        });

      nodeGroupElements
        .attr('transform', function (nodeItem) {
          return 'translate(' + nodeItem.x + ',' + nodeItem.y + ')';
        });
    });

    // ---- STEP 12: Cleanup — stop simulation when component unmounts or deps change ----
    return function cleanupGraphSimulation() {
      if (simulationRef.current !== null) {
        simulationRef.current.stop();
        simulationRef.current = null;
      }
    };
  // IMPORTANT: The dependency array uses ONLY stable values.
  // - props.nodes and props.edges are arrays stored in state (identity only
  //   changes when new data is fetched).
  // - visibleTagsKey is a string derived from the Set, so it only changes
  //   when the actual tags change, not when a new Set object is created.
  // - We do NOT include props.onNodeClick or props.onNodeHover here because
  //   those are plain functions recreated every render — including them would
  //   destroy and rebuild the simulation on every render, causing jitter.
  //   Instead we read them from refs (onNodeClickRef / onNodeHoverRef).
  }, [props.nodes, props.edges, visibleTagsKey]);

  return (
    <svg
      ref={svgRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '500px',
        backgroundColor: '#FFFFFF',
      }}
    />
  );
}
