

function VShape(id, pathData, fillColor) {

    extend(this, new SetWithUniverse());

    var that = this;

    this.id = id;
    this.name = "Path " + id;

    this.outline = new CompoundPath(pathData);
    this.outline.strokeColor = "black";
    this.outline.fillColor = "white";
    this.outline.children.forEach(function(p) {
        p.flatten(5);
    });

    
    this.fill = new Group({
        strokeColor: 'black',
        // visible: false,
    });

    console.log(JSON.stringify(fillColor.gray));
    var f = 1;
    if (Math.abs(fillColor.gray - 0.1266921568627451) < 0.01) f = "none";
    
    this.appearence = this.appearence || {
        spacing: fillColor.gray * 10.0,
        angle: Math.random()*180,
        filltype: "hatch",
        _fill: f,
        _outline: 1,
    };

    this.cloneAppearence = function(appearence) {
        for (var key in appearence) {
            this.appearence[key] = appearence[key];
        }
        //use the getters and setters
        this.appearence.fill = appearence.fill;
        this.appearence.outline = appearence.outline;
    }
    // we want to know when fill and outline in appearence
    // are set, so define getters and setters
    
    Object.defineProperty(this.appearence, "fill", {
        set: function(v) {
            that.fill.visible = v !== "none";
            this._fill = v;
        },
        get: function() {
            return this._fill;
        }
    });

    Object.defineProperty(this.appearence, "outline", {
        set: function(v) {
            that.outline.visible = v !== "none";
            this._outline = v;
            console.log("setting outline");
        },
        get: function() {
            console.log("getting outline...");
            return this._outline;
        }
    });

    this.appearence.fill = f;


    this.clearDrawing = function() {
        this.outline.remove();
        this.fill.remove();
    }
    
    this.makeLines = function(lines) {
        var a = this.appearence;
        
        if (lines === undefined) {
            if (a.filltype === "hatch") {
                lines = hatchLinesForShape(a.angle, a.spacing, this.outline);
            }
            else if (a.filltype === "joinedhatch") {
                lines = joinedHatchLinesForShape(a.angle, a.spacing, this.outline);
            }
            else if(a.filltype === "zigzag") {
                lines = zigzagLinesForShape(a.angle, a.spacing, this.outline);
            }
            else if (a.filltype === "offset") {
                lines = [];
                offsetsForShape(this);
            }

        }
        
        this.fill.removeChildren();
        this.fill.addChildren(lines);
        this.fill.strokeColor = "black";
    }

    this.getPerims = function(getMinOutline) {
        
        var outerEdges = getPerimeterEdges(this);
        var perims = pathFromPerimeterEdges(outerEdges, getMinOutline);
        return perims;
    };
    
    this.draw = function() {
        // var start = performance.now();

        // var perims = this.getPerims(getMinOutline);
        // this.perims = mergeLines(perims);

        // // always do this even if it's not visible so we can do offseting
        // makeOutline(this.perims, this.outline);
        
        if (this.fill.visible) {
            this.makeLines();
        }
        
        // console.log("draw took " + (performance.now() - start) + "");
    };   

    this.mergeLines = function(getMinOutline) {
        var outerEdges = getPerimeterEdges(this);
        var perim = pathFromPerimeterEdges(outerEdges, getMinOutline);
        this.perim = mergeLines(perim);
        makeOutline(perim, this.outline);  
    };

    this.data = function() {
        return {
            "pathData": this.outline.pathData,
            "id": this.id,
            "name": this.name,
            "appearence": this.appearence,
        };
    };

}
