var svgTree
var g_Node
var g_tree = []
var g_selection = []
var g_index = 1;
var g_diameter = 20;
var g_xStep = 50
var g_yStep = 50
var g_startX = 0;
var g_startY = g_yStep;
var g_insertStage = "compare";		//"compare", "move", "insert"
var g_highlight = 0;
var g_value = null;
var g_isPlaying = false;

// parent id : 0  : root
//			  -1 : new node
function Node(id, val, x, y)
{
	this.id = id;
	this.value = val;
	this.x = x;
	this.y = y;
	this.leftWidth = 0;
	this.rightWidth = 0;
	this.left = 0;
	this.right = 0;
	this.parent = -1;	// undefined
}

Node.prototype.isLeftChild = function()		
{
	if (this.parent == null)
	{
		return true;
	}
	return this.parent.left == this;	
}

window.onload = function() {

	svgTree = d3.select("#d3-splaytree")
	g_Node = svgTree.append("g")

	var w = document.getElementById("svg_width").value
	g_startX = w / 2;

	document.getElementById("inNumber").oninput = function(e) {
		if( this.value.length > this.maxLength ) {
			this.value = this.value.slice(0, this.maxLength);			
		}
	}

	onPlay();
}

function onChangeCanvasSize () {
	var w = document.getElementById("svg_width").value
	var h = document.getElementById("svg_height").value
	document.getElementById("d3-splaytree").setAttribute('width', w)
	document.getElementById("d3-splaytree").setAttribute('height', h)
}

function onMoveControl () {
	var current = document.getElementById("control").style.order;
	if( current == 0 ) {
		document.getElementById("control").style.order = 1;
	} else {
		document.getElementById("control").style.order = 0;
	}
}

function onChangeSpeed () {
	document.getElementById("animation_speed_val").innerHTML = document.getElementById("animation_speed").value;
}

function goInsertNextStep() {
	if( g_tree.length == 0 )
		return false;
	if( g_value == null || g_value.parent != -1)
		return false;

	var node
	if( g_insertStage == "" || g_insertStage == "insert" ) {
		g_insertStage = "compare"
		if( g_highlight == 0 ) {
			node = findRootNode();
		} else {
			node = findNode(g_highlight);
		}
		g_highlight = node.id
		g_selection.push( node )
	} else if (g_insertStage == "compare" ){
		g_insertStage = "move"

		if( g_highlight == 0 ) {
			node = findRootNode()
		} else {
			node = findNode(g_highlight);
		}
		g_selection = [];
		if( node.value > g_value.value ) {
			if( node.left > 0 )
				g_selection.push( findNode(node.left) )
		} else {
			if( node.right > 0 )
				g_selection.push( findNode(node.right) )
		}
	} else if (g_insertStage == "move") {		
		g_insertStage = "insert"
		g_selection = [];
		if( g_highlight == 0 ) {
			node = findRootNode()
		} else {
			node = findNode(g_highlight);
		}

		if( node.value > g_value.value ) {
			if( node.left == 0 ) {
				node.left = g_value.id
				g_value.parent = node.id
				g_value.x = node.x - g_xStep / 2;
				g_value.y = node.y + g_yStep;

				resizeTree()
			} else {
				g_highlight = node.left
			}
		} else {
			if( node.right == 0 ) {
				node.right = g_value.id
				g_value.parent = node.id				
				g_value.x = node.x + g_xStep / 2;
				g_value.y = node.y + g_yStep;

				resizeTree()
			} else {
				g_highlight = node.right
			}
		}
	}

	return true;
}

function findRootNode() {
	var ret = null;
	g_tree.forEach( (node) => {
		if( node.parent == 0 )
			ret = node;
	})

	return ret;
}

function findNode(idx) {
	var ret = null;
	g_tree.forEach( (node) => {
		if( node.id == idx )
			ret = node;
	})

	return ret;
}

function onInsert(){
	var val = document.getElementById("inNumber").value;
	if( val == '' )
		return;

	if( g_tree.length == 0 ) {
		g_value = new Node(g_index++, +val, g_startX, g_startY)
		g_value.parent = 0;
		g_tree.push(g_value)
	} else {
		g_value = new Node(g_index++, +val, g_diameter * 2, g_diameter * 2)
		g_tree.push(g_value)
	}

	g_highlight = 0;
	g_insertStage = "";

	updateSvg();

	if( g_isPlaying )
		play();
}


function onDelete(){
	g_highlight = 0;
}


function onFind(){
	g_highlight = 0;
}


function onPrint(){
	g_highlight = 0;
}

function setNewPosition(tree, xPos, yPos, side) {
	if( tree == null )
		return;
	tree.y =  yPos;
	if( side == -1 )
		xPos -= tree.rightWidth;
	else if ( side == 1 )
		xPos += tree.leftWidth;

	tree.x = xPos;

	setNewPosition( findNode(tree.left), xPos, yPos + g_yStep, -1 )
	setNewPosition( findNode(tree.right), xPos, yPos + g_yStep, 1 )
}

function resizeTree() {
	var startPoint = g_startX;
	var rootNode = findRootNode();
	if( rootNode ) {
		resizeWidths(rootNode)

		if(rootNode.leftWidth > startPoint) {
			startPoint = rootNode.leftWidth
		} else if( rootNode.rightWidth > startPoint ) {
			startPoint = Math.max( rootNode.leftWidth, 2 * startPoint - rootNode.rightWidth )
		}

		setNewPosition(rootNode, startPoint, g_yStep, 0)
	}
}

function resizeWidths(tree) 
{
	if (tree == null)
	{
		return 0;
	}
	tree.leftWidth = Math.max(this.resizeWidths(findNode(tree.left)), g_xStep / 2);
	tree.rightWidth = Math.max(this.resizeWidths(findNode(tree.right)), g_xStep / 2);
	return tree.leftWidth + tree.rightWidth;
}

function play() {
	var aniSpeed = document.getElementById("animation_speed").value
	setTimeout(function() {
		var ret = onStepForward()
		if( g_isPlaying && ret ) {
			play()
		}
	}, aniSpeed);
}

function onPlay() {
	g_isPlaying = !g_isPlaying

	if( g_isPlaying ) {
		document.getElementById("control_stepback").disabled = true;
		document.getElementById("control_stepforward").disabled = true;
		document.getElementById("control_skipforward").disabled = true;

		document.getElementById("control_play").value = "Pause";		
	} else {
		document.getElementById("control_stepback").disabled = false;
		document.getElementById("control_stepforward").disabled = false;
		document.getElementById("control_skipforward").disabled = false;

		document.getElementById("control_play").value = "Play";		
	}
	play();
}

function onStepForward () {
	var ret = goInsertNextStep()

	if( ret == false ) {
		//goNext
	}

	updateSvg()

	return ret;
}

function calcLineXY(x1, y1, x2, y2, r) {
	var ret = [0, 0]
    var angle = Math.atan2( y1 - y2, x1 - x2 ); 

	ret[0] = x1 - r * Math.cos(angle)
	ret[1] = y1 - r * Math.sin(angle)

	return ret;
}

function updateSvg() {
    //rejoin data
    var nodes = g_Node.selectAll(".node").data(g_tree);
    
    nodes.exit().remove();//remove unneeded circles
    var node = nodes.enter()
    				.append("g")
    				.attr('class', 'node')

    var links = node.append("line")
    	.attr("class", "unlink")
    	.attr("marker-end", "url(#arrow)")    	
        .attr("x1",function(d)  { return d.x })
        .attr("y1",function(d) { return d.y })
        .attr("x2",function(d) { return d.x })
        .attr("y2",function(d) { return d.y })
         .attr("stroke","#383070")  
         .attr("stroke-width",2)  
    

    var nodeDot = node.append("g")
    	.attr('class', 'point')
    	.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")" })

    nodeDot.append("circle")
    	.attr("class", "circle")
        .attr("r",g_diameter)
        .attr("cx", 0)
        .attr("cy", 0)

    nodeDot.append("text")
    	.attr("class", "textcircle")
        .attr("x", 0)
        .attr("y", 5)
        .text(function(d) { return d.value })

	var aniSpeed = document.getElementById("animation_speed").value
    //update all circles to new positions
    var updateNode = nodes.transition()
        .duration(aniSpeed / 2)

    updateNode.select('.point')
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")" })

    updateNode.select("circle")
        .attr("stroke", function(d) { 
        	if (g_insertStage == "compare") {
        		if( d.id == g_highlight || d.parent == -1 ) {
        			return "red"
        		}
        	}

        	return "white"
        });

    updateNode.select(".unlink, .link")
    	.attr("class", function(d) {
    		if( d.parent == 0 || d.parent == -1 ) 
        		return "unlink"
        	return "link"
    	})    	
        .attr("x1",function(d)  {
        	if( d.parent == 0 )
        		return d.x

        	var parent = d.parent;
        	if( d.parent == -1 ) {
        		if( g_highlight == 0 )
	        		return d.x

	        	parent = g_highlight
        	}
        	var parentNode = findNode(parent);

        	var dot = calcLineXY(parentNode.x, parentNode.y, d.x, d.y, g_diameter)
        	return dot[0]
        })
        .attr("y1",function(d) {
        	if( d.parent == 0 )
        		return d.y

        	var parent = d.parent;
        	if( d.parent == -1 ) {
        		if( g_highlight == 0 )
	        		return d.y

	        	parent = g_highlight
        	}
        	var parentNode = findNode(parent);

        	var dot = calcLineXY(parentNode.x, parentNode.y, d.x, d.y, g_diameter)
        	return dot[1]
        })
        .attr("x2",function(d) {
        	if( d.parent == 0 )
        		return d.x

        	var parent = d.parent;
        	if( d.parent == -1 ) {
        		if( g_highlight == 0 )
	        		return d.x

	        	parent = g_highlight
        	}
        	var parentNode = findNode(parent);

        	var dot = calcLineXY(d.x, d.y, parentNode.x, parentNode.y, g_diameter + 3)
        	return dot[0]
        })
        .attr("y2",function(d) {        	
        	if( d.parent == 0 )
        		return d.y

        	var parent = d.parent;
        	if( d.parent == -1 ) {
        		if( g_highlight == 0 )
	        		return d.y

	        	parent = g_highlight
        	}
        	var parentNode = findNode(parent);

        	var dot = calcLineXY(d.x, d.y, parentNode.x, parentNode.y, g_diameter + 3)
        	return dot[1]
        })

    //////////////////////////////////////////
    var selection = g_Node.selectAll(".selection").data(g_selection);

    selection.exit().remove();//remove unneeded circles
    var node = selection.enter()
    				.append("circle")
    				.attr('class', 'selection')
			        .attr("r",g_diameter)
			        .attr("cx", function(d) { return d.x})
			        .attr("cy", function(d) { return d.y})
			        .attr("visibility", "hidden")

    //update all circles to new positions
    var updateSelection = selection.transition()
        .duration(aniSpeed / 2)
        .attr("visibility", "visible")
        .attr("cx", function(d) { return d.x})
        .attr("cy", function(d) { return d.y})

}

