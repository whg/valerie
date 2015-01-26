// function go(){
paper.install(window);
paper.setup(document.getElementById("canvas")); 

var sqrt3 = Math.sqrt(3);

var side = 50;
var alt = sqrt3 * side * 0.5;


var nx = 29;
var ny = 48;

var boundsSize = new Size(nx*alt, ny*side);

var Index = Point;
Index.prototype.toString = function() {
    return this.x + "," + this.y;
}

function Triple(n, p, h) {
    this.n = n;
    this.p = p;
    this.h = h;

    this.clone = function() {
        return new Triple(this.n, this.p, this.h);
    }

    this.sum = function() {
        return this.n + this.p + this.h;
    }

    this.map = function(cb) {
        return new Triple(cb(this.n), cb(this.p), cb(this.h));
    }

    this.toString = function() {
        return this.n + "," + this.p + "," + this.h;
    }
}


function sorted(a) { 
    var b = a.slice(0); 
    b.sort(); 
    return b; 
}

function extend(subclass, superclass) {
    for (var key in superclass) {
        subclass[key] = superclass[key];
    }
    return subclass;
}


function mergeObjects() {
    var r = {};
    for (var ak in arguments) {
        var obj = arguments[ak];
        for (var key in obj) {
            r[key] = obj[key];
        }
    }
    return r;
}

function Edge(start, end) {
    this.start = start;
    this.end = end;

    //create an id where the start and the end doesn't matter
    this.getId = function () {
        var id = this.start.id + "-" + this.end.id;
        return sorted(id.split('-')).join('-');
    }

    this.toString = function() {
        // return this.start.id + "-" + this.end.id;
        return this.getId();
    }

}

var things = [Index, Triple, Edge];
for(var i = 0; i < things.length; i++) {
    Object.defineProperty(things[i].prototype, "id", {
        get: function id() {
            return this.toString();
        },
        configurable: true,
    });
}

function ILine(startIndex, endIndex) {
    this.start = startIndex;
    this.end = endIndex;
    return this;
}

function RingBuffer(size, banConsecutive) {

    this.size = size;
    this.values = new Array(size);
    this.pos = 0;


    this.pushBasic = function(v) {
        this.values[this.pos] = v;
        this.pos++;
        this.pos%= this.size;
        return true;
    }
    
    this.pushNoConsecutive = function(v) {
        if (v == this.peek()) {
            return false;
        }
        return this.pushBasic(v);
    }
    
    if (banConsecutive) {
        this.push = this.pushNoConsecutive;
    }
    else {
        this.push = this.pushBasic;
    }

    this.peek = function() {
        var i = (this.pos - 1 + this.size) % this.size;
        return this.values[i];
    }
    
    this.pop = function() {   
        if (this.pos == 0) {
            this.pos+= this.size;
        }
        this.pos--;
        var ret = this.values[this.pos];
        this.values[this.pos] = undefined;
        return ret;
    }
    return this;
}


function indexToGrid(index) {
    var y = index.y * 2 + (index.x+1) % 2
    return new Index(index.x, y);
}

function pointAtIndex(index) {
    var g = indexToGrid(index);
    return new Point(g.x* alt, g.y * side * 0.5);
}

function isValidGridIndex(index) {
    return (index.x + index.y) % 2 === 1;
}

function pointAtGridIndex(index) {
    return new Point(index.x * alt, index.y * side * 0.5);
}


function drawAllPoints() {
    for(var i = 0; i < nx; i++) {
        for(var j = 0; j < ny; j++) {
            var index = new Index(i, j);

            if (isValidGridIndex(index)) {
                var sq = new Path.Circle(pointAtGridIndex(index), 2.5);
                sq.fillColor = "#ccc";
            }
        }
    }
}

function numLines(type, size) {
    if (type === 'H') {
        return size.x;
    }
    else {
        return Math.floor((size.x + size.y - 2) / 2);
    }
}

function firstLine(type, size) {
    var line = new ILine();
    line.start = new Index(0, 1);
    if (type === 'H') {
        line.end = new Index(0, size.y  - size.y % 2 - 1);
    }
    else if (type === 'N') {
        var sxm = (size.x + 1) % 2;        
        line.start = new Index(size.x - 2 - sxm, 0);
        line.end = new Index(size.x - 1, 1 + sxm);
    }
    else if (type === 'P') {
        line.end = new Index(1, 0);
    }   

    return line;
}

function incXP(index, size) {
    if (index.x < size.x - 1) index.x++;
    else index.y++;
    return index;
}

function incYP(index, size) {
    if (index.y < size.y - 1) index.y++;
    else index.x++;
    return index;
}

function incXN(index, size) {
    if (index.x > 0) index.x--;
    else index.y++;
    return index;
}

function incYN(index, size) {
    if (index.y < size.y - 1) index.y++;
    else index.x--;
    return index;
}

function twice(func, a1, a2) {
    var v = func(a1, a2);
    return func(v, a2);
}


function nextLine(line, type, size) {
    if (type === 'H') {
        line.start.y = line.start.x % 2;
        line.start.x++;

        if(line.end.y === size.y - 1) line.end.y--;
        else line.end.y++;

        line.end.x++;
    }
    else if (type === 'N') {
        line.start = twice(incXN, line.start, size);
        line.end = twice(incYN, line.end, size);
    }
    else if (type === 'P') {
        line.start = twice(incYP, line.start, size);
        line.end = twice(incXP, line.end, size);
    }
    return line;
}

function drawGridLines(type, size) {
    var n = numLines(type, size);
    var line = firstLine(type, size);

    for (var i = 0; i < n; i++) {
        var p = new Path.Line({
            from: pointAtGridIndex(line.start),
            to: pointAtGridIndex(line.end),
            strokeColor: '#aaa',
            strokeScaling: false,
        });
        line = nextLine(line, type, size);
    }
}

function drawGrid() {
    drawGridLines('N', new Index(nx, ny));
    drawGridLines('P', new Index(nx, ny));
    drawGridLines('H', new Index(nx, ny));
}
drawGrid();

function _project(point, line) {
    /// use dot product to project a point on to a line
    
    var toP = point.subtract(pointAtGridIndex(line.start));
    var toEnd = pointAtGridIndex(line.end).subtract(pointAtGridIndex(line.start));

    var l = toEnd.length;
    var dp = toP.dot(toEnd);
    dp/= l*l;

    var proj = toEnd.multiply(dp);
    proj = proj.add(pointAtGridIndex(line.start));
    return proj;
}

function distanceToLine(point, line) {
    /// signed distance between point and line
    /// negative distance if point.y < projected.y 

    var proj = _project(point, line);
    var len = (proj.subtract(point)).length;

    if (point.y < proj.y) {
        len = -len;
    }

    return len;
}

function axisLine(type) {
    var line = new ILine();
    line.start = new Index(0, 1);
    if (type === 'H') {
        line.end = new Index(0, 3);
    }
    else if (type === 'N') {
        line.end = new Index(1, 2);
    }
    else if (type === 'P') {
        line.end = new Index(1, 0);
    }   

    return line;
}

function getAxes() {
    return new Triple(axisLine('N'), axisLine('P'), axisLine('H'));
}

function getAxesArray() {
    var axes = getAxes();
    return [axes.n, axes.p, axes.h];
}

function drawAxes() {
    var axes = getAxesArray();
    for (var i = 0; i < axes.length; i++) {
        new Path.Line({
            from: pointAtGridIndex(axes[i].start),
            to: pointAtGridIndex(axes[i].end),
            strokeColor: '#00f'
        });
    }
}

// drawAxes();
var axes = getAxes();

function interceptForAxis(axis, number) {
    if (axis === 'P') {
        return (number + 1) * 2 - 1;
    }
    else if (axis === 'N') {
        return number * 2 + 1;
    }
}


function triangleDirection(triple) {
    if (triple.sum() % 2 === 0) {
        return 'F';
    }
    return 'B';
}

function indexToSides(triple) {
    //given an [n,p,h] tuple return another [n,p,h]
    //tuple which is the sides of the triangle
    var direction = triangleDirection(triple);

    var ret = triple.clone();

    if (direction === 'F') {
        ret.p++;
    }
    else if (direction === 'B'){
        ret.n++;
        ret.h++;
    }
    return ret;
}

function verticesForTriple(triple) {

    var sides = indexToSides(triple);
    var direction = triangleDirection(triple);

    var verts;
    if (direction === 'F') {
        verts = [ 
            new Index(sides.h, sides.h + interceptForAxis('N', sides.n)),
            new Index(sides.h+1, interceptForAxis('P', sides.p) - (sides.h+1)),
            new Index(sides.h, interceptForAxis('P', sides.p) - sides.h)
        ];
    }
    else if (direction == 'B') {
        verts = [
            new Index(sides.h-1, sides.h - 1 + interceptForAxis('N', sides.n)),
            new Index(sides.h, interceptForAxis('P', sides.p) - sides.h),
            new Index(sides.h, sides.h + interceptForAxis('N', sides.n))
        ];   
    }
    return verts;
}


function worldToLocal(point, alt, axis) {
    // return an index used in tri coordinates
    var d = distanceToLine(point, axis);
    return Math.floor(d/alt);
}

function worldToTriple(point, alt) {
    // given a point in screen coords, 
    // and the altitude of the triangles
    // return index Triple
    var axes = getAxes();
    return new Triple(
        worldToLocal(point, alt, axes.n),
        Math.abs(worldToLocal(point, alt, axes.p)),
        Math.floor(point.x / alt));
}


// a basic Set class
// usage:
//   var s = new Set();
//   s.add(5);
function Set() {
    this._values = {};
    
    
    this.has = function(e) {
        // this is the fastest way to do this
        // http://jsperf.com/regex-vs-indexof-vs-in
        return this._values[e] !== undefined;
    };
    

    this.add = function(e) {
        if (!this.has(e)) {
            this._values[e] = e;
            return true;
        }
        return false;
    };

    this.remove = function(e) {
        delete this._values[e];
    }

    this.clear = function() {
        // is this._values = {} better?
        for (var key in this._values) {
            delete this._values[key];
        }
        this._values = {};
    }

    this.values = function() {
        return Object.keys(this._values);
    };

    this.toString = function() {
        return "Set( " + this.values().join(', ') + " )";
    };

    return this;
}

function SetWithUniverse(universe) {
    // default universe is the database
    extend(this, new Set());

    this._universe = universe;

    if (universe === undefined) {
        this._universe = createDatabase();
    }


    this.exists = function(e) {
        return this._universe[e] !== undefined;
    }

    this.add = function(e) {
        if (!this.has(e) && this.exists(e)) {
            this._values[e] = e;
            return true;
        }
        return false;
    };
    
    return this;
}


function triplesForDimension(size) {
    // calculate and return an array of all the triangles
    // for a given size (in indices not real world)
    // the logic is that we move down each column
    var ret = [];
    var n = 0, p = 0, h = 0;
    for (var h = 0; h < size.width - 1; h++) {
        p = Math.floor(h / 2);
        n = -p - 1;

        for (var j = 0; j < size.height - 2; j++) {

            ret.push(new Triple(n, p, h));

            if (j % 2 === h % 2) {
                n++;
            }
            else {
                p++;
            }
        }
    }
    return ret;
}

function createTriangle(tid, vertices) {
    return {
        'id': tid,
        'vertices': vertices,
        'edges': [
            new Edge(vertices[0], vertices[1]),
            new Edge(vertices[1], vertices[2]),
            new Edge(vertices[2], vertices[0]),
        ],
    }
}

function createDatabase(size) {
    var db = {};
    var triples = triplesForDimension(new Size(nx, ny));
    for(var i = 0; i < triples.length; i++) {
        var verts = verticesForTriple(triples[i]);
        db[triples[i].id] = createTriangle(triples[i].id, verts);

    }
    return db;
}

var db = createDatabase(); 
// console.log(Object.keys(db));
var pts = {}; //= new Set(Object.keys(db));

function getPerimeterEdges(pntSet) {
    var outerEdges = {};
    var vs = pntSet.values();

    //we want only one occurence of each edge,
    //add things to an object, if the key is there delete...
    //this makes it nicely linear in time
    for (var i = 0; i < vs.length; i++) {
        
        for (var j = 0; j < 3; j++) {

            var edge = db[vs[i]].edges[j];

            if (outerEdges[edge.id] === undefined) {
                outerEdges[edge.id] = edge;
            } 
            else {
                delete outerEdges[edge.id];
            }
        }
    }
    return outerEdges;
}

function pathFromPerimeterEdges(edges) {
    // takes the object created by getPerimeterEdges(),
    // namely, an object with edge ids as keys and
    // edge objects as values
    // returns a list of edge lists

    function IndexHolder(elem) {
        this.elem = elem;
        this.data = {};
        this.pushEdge = function(edge) {
            var index = edge[this.elem];
            if (this.data[index.id] !== undefined) {
                this.data[index.id].push(edge);
            }
            else {
                this.data[index.id] = [edge];
            }
        };

        this.popIndex = function(index) {
            var ret = undefined;
            
            if (this.data[index.id] !== undefined) {

                var r = this.data[index.id].splice(0, 1);

                if (r.length > 0) {
                    ret = r[0];
                }
                if (this.data[index.id].length === 0){
                    delete this.data[index.id];
                }
            }
            return ret;
        };
    }

    var starts = new IndexHolder("start");
    for (var key in edges) {
        var e = edges[key];
        starts.pushEdge(e);
    }


    var q = 0;
    var perims = [];
    do {
        var sortedStarts = sorted(Object.keys(starts.data));
        if (sortedStarts.length === 0) {
            break;
        }

        var firstEdge = starts.data[sortedStarts[0]][0];
        var perim = [starts.popIndex(firstEdge.start)];
        var prevEdge, nextEdge;

        do {
            prevEdge = perim[perim.length-1];
            nextEdge = starts.popIndex(prevEdge.end);

            perim.push(nextEdge);
        } while (nextEdge.end.id !== firstEdge.start.id);

        perims.push(perim);
        
    } while (q++ < 1000);
    

    return perims;
}


function makeOutline(perims, outline) {
    var perim = perims[0];
    if (perim.length === 0) return;

    outline.removeChildren();
    for (var i = 0; i < perims.length; i++) {
        var p = Path.Line();
        p.removeSegments();
        p.addSegment(pointAtGridIndex(perims[i][0].start));
        for (var j = 0; j < perims[i].length; j++) {
            p.addSegment(pointAtGridIndex(perims[i][j].end));
            
        }
        outline.addChild(p);

    }
}




function TShape(id) {

    extend(this, new SetWithUniverse());
    
    // this.pts = new Set();
    this.id = id;
    this.order = Object.keys(shapes).length;
    this.outline = new CompoundPath({
        strokeColor: 'black',
        fillColor: new Color(1.0, id/2.0, 1.0), //"#cfe",
        // closed: true,
    });

    this.outline.fillColor = new Color(Math.random(), Math.random(), Math.random()); //, 0.4);
    this.outline.id = id;
    this.draw = function() {
        var outerEdges = getPerimeterEdges(this);
        var perim = pathFromPerimeterEdges(outerEdges);
        makeOutline(perim, this.outline);  
    };   


    
    return this;
}



function InvertedIndex() {

    var index = {};

    this.add = function(tripleId, shapeId) {
        if (index[tripleId] === undefined) {
            index[tripleId] = [shapeId];
        }
        else {
            index[tripleId].push(shapeId);
        }
    }

    this.remove = function(tripleId, shapeId) {
        // let's presume tripleId exists in index
        var i = index[tripleId].indexOf(shapeId);
        if (i >= 0) {
            index[tripleId].splice(i, 1);

            if (index[tripleId].length === 0) {
                delete index[tripleId];
            }
        }
    }

    this.has = function(tripleId) {
        return index[tripleId] !== undefined && index[tripleId].length > 0;
    }

    this.at = function(tripleId) {
        return index[tripleId];
    }

    this.values = function() {
        return index;
    }
}

var invertedIndex = new InvertedIndex;


function Shapes() {

    var shapes = {};
    this.layer = new Group();

    var ids = 0;
    this.nextId = function() {
        return ids++;
    };
    
    
    this.get = function(key) {
        return shapes[key];
    };

    this.add = function(key) {
        shapes[key] = new TShape(key);
        // shapes[key].outline.setLayer(layer);
    };

    this.remove = function(key) {
        shapes[key].outline.remove();
        delete shapes[key];

    };

    this.keysInOrder = function() {
        return Object.keys(shapes).sort(function(a,b){
            return shapes[a].order - shapes[b].order;
        });
    };

    this.highestFromArray = function(arr) {

        if (arr === undefined) return undefined;
        
        var maxOrder = 0, highestShape = undefined;

        for (var i = 0; i < arr.length; i++) {

            var shapeId = arr[i];
            if (shapes[shapeId].order > maxOrder) {
                highestShape = shapeId;
                maxOrder = shapes[shapeId].order;
            }
        }
        return highestShape;
    }
    
    return this;
}
var shapes = new Shapes();


function UI() {
    
    $("#shapes").sortable({
        update: function(event, ui) {

            var ordered = $(this).sortable("toArray", { "attribute": "key" });
            for (var i = 0; i < ordered.length; i++) {
                var key = ordered[i];
                shapes.layer.insertChild(i, shapes.get(key).outline);
                shapes.get(key).order = i;
            }
            project.view.draw();
        },
        change: function(event, ui) {
            
        }
    });
  
    
    this.updateShapes = function() {
        var ids = shapes.keysInOrder(shapes);
        $("#shapes").html("");
        for (var i = 0, shape = null; i < ids.length; i++) {
            shape = shapes.get(ids[i]);
            $("#shapes").append("<li key='" + shape.id + "'>Shape " + shape.id + "</li>");
        }
    }

    return this;
}
var ui = new UI();
// var shapes = {};
// var currentTriangeId = null;
var current = { triple: null, shape: null, selected: new Set() };

function Command(action, direction, args) {
    this.action = action;
    this.direction = direction;
    this.args = new Array(args.length);
    for (var i = 0; i < args.length; i++) {
        this.args[i] = args[i];
    }

    function reverse(dir) {
        if (dir === "forward") return "backward";
        return "forward";
    }

    this.execute = function(reversed) {

        var dir = this.direction;
        if (reversed) {
            dir = reverse(dir);
        }

        var name = this.action[dir].apply(undefined, this.args);
        console.log("executed " + name + " with " + this.args);
    };

    return this;
}

function Invoker() {
    var commands = [];
    var pos = 0;

    this.push = function(action, direction, args) {

        var comm = new Command(action, direction, args);

        if (pos !== commands.length) {
            commands = commands.splice(0, pos);
        }

        commands.push(comm);
        comm.execute();
        pos++;
    };

    this.undo = function() {
        if (pos < 1) wm("nothing to undo");
        else {
            commands[--pos].execute(true);
        }
    };

    this.redo = function() {
        if (pos === commands.length) wm("can't redo");
        else {
            commands[pos++].execute();
        }
    };
}


function Action() {

    function pan(event) {
        project.activeLayer.translate(event.delta);
    }

    function zoom(event) {
        project.activeLayer.scale(1 + (event.delta.y * 0.005), event.point);
    }

    // function ExtendTriangleAction(direction) {
    // }

    var CreateTriangleAction = {
        "name": "CreateTriangle",
        "forward": function(triple, shapeId){

            shapes.add(shapeId);
            // invertedIndex[triple] = shapeId;
            // addTriangle(event);
            ExtendTriangleAction.forward(triple, shapeId);

            //update UI
            ui.updateShapes();

            return "Create";
        },
        "backward": function(triple, shapeId){
            shapes.remove(shapeId);
            // delete invertedIndex[triple];
            invertedIndex.remove(triple.id, shapeId);
            return "Delete";
        },
    };

    var ExtendTriangleAction = {
        "name": "ExtendTriangle",
        "forward": function(triple, shapeId) {

            //it's new so update the inverted index
            shapes.get(shapeId).add(triple);
            // invertedIndex[triple] = shapeId;
            invertedIndex.add(triple.id, shapeId);
            wm("extend shape at " + triple);

            current.triple.id = triple;
            shapes.get(shapeId).draw();

            return "Extend";

        },
        
        "backward": function(triple, shapeId) {

            shapes.get(shapeId).remove(triple);
            // delete invertedIndex[triple];
            invertedIndex.remove(triple.id, shapeId);
            shapes.get(shapeId).draw();
            wm("shink shape at " + triple.id);
            return "Shrink";
        },
        
    };


    var invoker = new Invoker();
    
    function addTriangle(event) {
        var triple = worldToTriple(project.activeLayer.globalToLocal(event.point), alt);

        if (!shapes.get(current.shape).has(triple)) {
            invoker.push(ExtendTriangleAction, "forward", [triple, current.shape]);
        }
        else {
            if (invertedIndex.has(triple.id) && triple.id !== current.triple.id) {
                invoker.push(ExtendTriangleAction, "backward", [current.triple, current.shape]);
            }
        }
        current.triple = triple;
        // ExtendTriangleAction.forward(triple);        
    }

    function findShape(event) {
        // console.log(invertedIndex);
        var triple = worldToTriple(project.activeLayer.globalToLocal(event.point), alt);
        current.triple = triple;
        current.shape = shapes.highestFromArray(invertedIndex.at(current.triple.id));
         // current.triple = triple.id;
        // console.log(invertedIndex);
        // console.log(triple.id);
        if (current.shape === undefined) {
            current.shape = shapes.nextId();// uidc.next();
            // ASDFASD
            invoker.push(CreateTriangleAction, "forward", [current.triple, current.shape]);
        }

        
        console.log("current shape = " + current.shape);
       
    }

    function removeTriangle(event) {
        var triple = worldToTriple(project.activeLayer.globalToLocal(event.point), alt);
        if (invertedIndex.has(current.triple.id) && triple.id !== current.triple.id) {
                // wm("removing at" + triple.id);
            if (shapes.get(current.shape).has(current.triple)) {
                    // wm("deleted at " + triple.id);
                var action = ExtendTriangleAction;
                if (shapes.get(current.shape).values().length === 1) {
                    action = CreateTriangleAction;
                }
                invoker.push(action, "backward", [current.triple, current.shape]);
            }
            current.triple = triple;
        }   
        
    }

    function selectShapes(event) {
        var triple = worldToTriple(project.activeLayer.globalToLocal(event.point), alt);
        var sid = shapes.highestFromArray(invertedIndex.at(triple.id)); //invertedIndex[triple.id];

        console.log(modifierStates["shift"] + " " + sid);

        if (sid === undefined) {
            for (var shape in current.selected._values) {
                shapes.get(shape).outline.selected = false;
            }

            current.selected.clear();
        }
        // else if (!modifierStates["shift"]) {
            
        // }
        // else if ()
        else {
            if (!modifierStates["shift"]) {
                for (var shape in current.selected._values) {
                    shapes.get(shape).outline.selected = false;
                }
                
                current.selected.clear();
            }
            console.log("sele");
            
            current.selected.add(sid);
            shapes.get(sid).outline.selected = true;

            current.triple = triple;
        }
        console.log(current.selected._values);
        // for (var shape in current.selected._values) {
        //     shapes.get(shape).outline.selected = true;
        // }
        
    }

    function moveShapes(event) {
        var triple = worldToTriple(project.activeLayer.globalToLocal(event.point), alt);
        if (triple.id !== current.triple.id) {
            console.log(current.triple);// + " -> " + triple.id);
        }
    }


    function createMouseMode(init, mouseDown, mouseDrag, mouseScroll) {
        return {
            init: init,
            mouseDown: mouseDown,
            mouseDrag: mouseDrag,
            mouseScroll: mouseScroll,
        };
    }



    var none = function() {};
    
    var modes = {
        "v": createMouseMode(none, none, pan, zoom),
        "a": createMouseMode(none, findShape, addTriangle, pan),
        "s": createMouseMode(none, selectShapes, none, none),
        "option": createMouseMode(none, none, pan, zoom),
        "d": createMouseMode(none, findShape, removeTriangle, pan),
        "m": createMouseMode(none, selectShapes, moveShapes, none),

    };

    var modifierStates = { "command": false, "control": false, "option": false, "shift": false };
    var modifiers = Object.keys(modifierStates);
    
    function atLeastOneModifier() {
        for (var key in modifierStates) {
            if (modifierStates[key]) {
                return true;
            }
        }
        return false;
    }

    var currentKey = "a";
    var lastKey = null;
    var pushedMode = false;

    var tool = new Tool();
    
    tool.onMouseDrag = function(event) {
        modes[currentKey].mouseDrag(event);
    }

    tool.onMouseDown = function(event) {
        modes[currentKey].mouseDown(event);
    }

    tool.onMouseScroll = function(event) {
        modes[currentKey].mouseScroll(event);

        paper.view.draw();
    }

    function KeyComboHandler() {
        var combos = {};

        function keysFromEvent(event) {
            var keys = [];
            for (var mod in event.modifiers) {
                if (event.modifiers[mod]) {
                    keys.push(mod);
                }
            }
            keys.push(event.key);
            return keys;
        }

        
        function makeKeyComboId(keys) {
            return sorted(keys).join("+");
        }

        this.add = function(keys, func) {
            combos[makeKeyComboId(keys)] = func;
        }

        this.call = function(event) {
            var keys = keysFromEvent(event);
            var id = makeKeyComboId(keys);
            if (combos[id] !== undefined) {
                combos[id]();
                // this.combos[id].apply(this)
                event.preventDefault();
                return false;
            }
        }
    }

    var keyHandler = new KeyComboHandler();
    keyHandler.add(["command", "shift", "z"], invoker.redo); //function() { invoker.redo(); });
    // keyHandler.add(["q", "shift"], function() { console.log("BIG QQQ!")});
    keyHandler.add(["command", "z"], invoker.undo); //function() { invoker.undo(); });
    

    tool.onKeyDown = function onKeyDown(event) {

        var ret = true;

        // console.log(event);
        // modifiers are treated seperately because they
        // don't repeat the call to onKeyDown
        if (event.key in modifierStates) {
            pushedMode = currentKey;
            modifierStates[event.key] = true;
        }
        else if (!pushedMode && currentKey === event.key && lastKey === event.key) {
            // we have repeated
            pushedMode = lastKey;
            // console.log("pushed " + lastKey + "(" + currentKey + ")");
        }
        else {

            //this means it's just a single press of a non modifier
            if (atLeastOneModifier()) {
                for (var key in modifierStates) {
                    event.modifiers[key] = modifierStates[key];
                }
                
                ret = keyHandler.call(event);

            }
        }

        if (modes[event.key] !== undefined) {
            lastKey = currentKey;
            currentKey = event.key;
        }
        // console.log(lastKey + " -> " +currentKey); // + " " + event);


        
        if(event.key == "backspace") {
            return false;
        }

        return ret; // might be false in which caaase don't do what you normally do
    }

    tool.onKeyUp = function onKeyUp(event) {
        if (pushedMode) {
            currentKey = pushedMode;
            console.log("poped, current key = " + currentKey);
            pushedMode = false;
        }
        if (modifierStates[event.key] !== undefined) {
            modifierStates[event.key] = false;
        }
        // event.preventDefault();
    }

    tool.scrollEvent = new ToolEvent(tool, "mousescroll", new MouseEvent());
    tool.scrollEvent.point = new Point();
    tool.scrollEvent.delta = new Point();

    $("#canvas").bind('mousewheel DOMMouseScroll', function(event){

        // console.log(event.originalEvent.deltaX + ", " + event.originalEvent.deltaY + ", " +event.originalEvent.wheelDelta);
        tool.scrollEvent.point.set(event.offsetX, event.offsetY);
        // tool.scrollEvent.delta = event.originalEvent.wheelDelta / 1900.0;
        tool.scrollEvent.delta.x = -event.originalEvent.deltaX * 0.5;
        tool.scrollEvent.delta.y = -event.originalEvent.deltaY * 0.5;
        tool.onMouseScroll(tool.scrollEvent);
        event.preventDefault();
    });

}
var action = new Action();

project.activeLayer.transformContent = false;


var outline = new CompoundPath({
    strokeColor: 'black',
    fillColor: "#cfe",
    // closed: true,
});

// debugger;

// project.activeLayer.scale(d2);

// console.log();
// console.log(db);

// drawAllPoints();

// console.log(avg([12,243.4,3.2,4,5.5]));

// for(var i = 1; i < nx; i+=2) {
//     console.log(i);
//     var sq = new Path.Circle(pointAtIndex(new Index(i, ny)).add(os), 2.5);
//     sq.fillColor = "#bbb";
// }

view.draw();
// };



/*

COMMANDS - for undo
- add triangle
- remove triangle
- 

MODES

constructive mode - everthing drag
notes


so many amazing things about paper.js
strokescaling = false, was a life saver!
.transformContent = false took me ages to figure out!
compoundPath is a joy to work with
*/

function wm(m) {
    $("#messages").append("<p>"+m+"</p>");
    if ($("#messages p").length > 10) {
        $('#messages p:lt(2)').remove();
    }
}
