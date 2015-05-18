

var sqrt3 = Math.sqrt(3);
var HOST = "http://localhost:5000";

project.activeLayer.transformContent = false;

var allOuters = new Group();
var gridGroup = new Group();
var axes = getAxes();
var nx = 0, ny = 0, side = 0, alt = 0;
var boundsSize = new Size(1520, 1032);

var boundingRect = new Path.Rectangle(new Point(0, 0), boundsSize);
boundingRect.strokeColor = '#b00';

var db = {}; //createDatabase(new Size(nx, ny)); 
var invertedIndex = new InvertedIndex;
var shapes = new Shapes();
var ui = new UI();
var plot = new Plot();

var invoker = new Invoker();
var keyHandler = new KeyComboHandler();
keyHandler.add("redo", ["command", "shift", "z"], invoker, "redo");
keyHandler.add("undo", ["command", "z"], invoker, "undo");
keyHandler.add("plot", ["command", "p"], plot, "all")
keyHandler.add("plotSelected", ["command", "shift", "p"], plot, "selected");
keyHandler.add("merge", ["command", "m"], mergeShapes);
keyHandler.add("duplicate", ["command", "d"], duplicateSelected);
keyHandler.add("download", ["command", "s"], ui, "download");
keyHandler.add("upload", ["command", "o"], ui, "upload");
keyHandler.add("export", ["command", "e"], ui, "exportCanvas");

keyHandler.add("plotoffsets", ["command", "x"], function() {
    plotOuterOffsets();
});

var action = new Action(invoker, keyHandler);

// action.addMode("select", createMouseMode("s", selectShape, marqueShapes, pan, marqueShapesUp));
action.addMode("shink", createMouseMode("d", findShape, removeTriangle, pan, none));
action.addMode("erase", createMouseMode("e", eraseTriangle, eraseTriangle, pan, none));
action.addMode("offsetRect", createMouseMode("b", none, offsetRectDrag, none, offsetRectUp));
action.addMode("clone", createMouseMode("c", cloneCurrentAppearence, cloneCurrentAppearence, pan, none));

// action.addMode("draw", createMouseMode("a", findShape, addTriangle, pan, none));

function findShape(event) {
    // debugger;

    var p = project.activeLayer.globalToLocal(event.point);
    shapes.shapeIds().forEach(function(key) {
        var shape = shapes.get(key);
        if (shape.outline.hitTest(p)) {
            ui.setCurrentShape(shape.id);
            // console.log(outline);
        }
    });
    
    // for (var key in shapes.shapes) {
        
    //     if (shapes.shapes[key].outline.hitTest() {
    //         console.log(shapes.shapes[key].outline);
    //         ui.setCurrentShape(shapes.)
    //     }
    // }
}

action.addMode("view", createMouseMode("v", findShape, pan, zoom, none));

// action.addMode("move", createMouseMode("m", ));

for (var modeKey in action.modes) {
    action.modes[modeKey].option = action.modes["view"];
}


var current = new Current();
action.selectMode("view")

view.draw();

// testPlotterConnection();


var globalShape = null;
$.get('files/one3.svg', function(data){
    console.log('loading data');
    globalShape = project.importSVG(data);
    // globalShape.strokeColor = "black";
    // globalShape.fillColor = "white";

    radd(globalShape);
    globalShape.remove();
    shapes.draw();
});


function radd(thing) {
    for (var i = 0; i < thing.children.length; i++) {
        var pjst = thing.children[i];
        if ("pathData" in pjst) {
            shapes.addShape(new VShape(pjst.id, pjst.pathData, pjst.fillColor));
            // console.log(pjst);
            pjst.fillColor = null;
        }
        else {
            radd(pjst);
        }
    }
}


