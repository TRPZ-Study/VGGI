'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.
let sphereSurface;              // A model to vizualize local light
let startTime = Date.now();

function deg2rad(angle) {
    return angle * Math.PI / 180;
}


// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iNormalBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function (vertices, normals) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STREAM_DRAW);

        this.count = vertices.length / 3;
    }

    this.Draw = function () {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.vertexAttribPointer(shProgram.iAttribNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribNormal);

        gl.drawArrays(gl.TRIANGLES, 0, this.count);
    }
}


// Constructor
function ShaderProgram(name, program) {

    this.name = name;
    this.prog = program;

    // Location of the attribute variable in the shader program.
    this.iAttribVertex = -1;
    this.iAttribNormal = -1;
    this.iColor = -1;
    this.iModelViewProjectionMatrix = -1;
    this.iNormalMatrix = -1;

    this.Use = function () {
        gl.useProgram(this.prog);
    }
}


/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* Set the values of the projection transformation */
    let projection = m4.orthographic(-5, 5, -5, 5, -3, 14)

    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
    let translateToPointZero = m4.translation(0, 0, -10);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView);
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0);
    let modelViewProjection = m4.multiply(projection, matAccum1);
    const normalMatrix = m4.identity();
    m4.inverse(modelView, normalMatrix);
    m4.transpose(normalMatrix, normalMatrix);

    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);
    gl.uniformMatrix4fv(shProgram.iNormalMatrix, false, modelViewProjection);
    gl.uniform1f(shProgram.iTime, (Date.now() - startTime) * 0.001);

    gl.uniform4fv(shProgram.iColor, [1, 1, 0, 1]);
    gl.uniform1i(shProgram.iLight, false);
    surface.Draw();

    gl.uniform1i(shProgram.iLight, true);
    sphereSurface.Draw();   
}

function repeatDraw() {
    draw()
    window.requestAnimationFrame(repeatDraw)
}

function CreateSurfaceData() {
    let vertexList = [];
    let normalList = [];
    let vertexListSphere = [];
    let normalListSphere = [];

    for (let j = 0; j < Math.PI * 2; j += 0.1) {
        for (let i = -1; i < 1; i += 0.05) {
            let temp = vertex(j, i, 2);
            let temp2 = vertex(j + 0.1, i, 2);
            let temp3 = vertex(j, i + 0.05, 2);
            let temp4 = vertex(j + 0.1, i + 0.05, 2);
            vertexList.push(temp.x, temp.y, temp.z);
            vertexList.push(temp2.x, temp2.y, temp2.z);
            vertexList.push(temp3.x, temp3.y, temp3.z);
            vertexList.push(temp3.x, temp3.y, temp3.z);
            vertexList.push(temp4.x, temp4.y, temp4.z);
            vertexList.push(temp2.x, temp2.y, temp2.z);
            
            
            let v21 = { x: temp2.x - temp.x, y: temp2.y - temp.y, z: temp2.z - temp.z },
            v31 = { x: temp3.x - temp.x, y: temp3.y - temp.y, z: temp3.z - temp.z },
            v42 = { x: temp4.x - temp2.x, y: temp4.y - temp2.y, z: temp4.z - temp2.z },
            v32 = { x: temp3.x - temp2.x, y: temp3.y - temp2.y, z: temp3.z - temp2.z };
            let n1 = cross(v21, v31),
            n2 = cross(v42, v32);
            normalization(n1);
            normalization(n2);

            normalList.push(n1.x, n1.y, n1.z)
            normalList.push(n1.x, n1.y, n1.z)
            normalList.push(n1.x, n1.y, n1.z)
            normalList.push(n2.x, n2.y, n2.z)
            normalList.push(n2.x, n2.y, n2.z)
            normalList.push(n2.x, n2.y, n2.z)
        }

        for (let i = 0; i < Math.PI; i += 0.05) {
            const r = 0.2;
            let temp = vertexBall(j, i, r);
            let temp2 = vertexBall(j + 0.1, i, r);
            let temp3 = vertexBall(j, i + 0.05, r);
            let temp4 = vertexBall(j + 0.1, i + 0.05, r);
            vertexListSphere.push(temp.x, temp.y, temp.z);
            normalListSphere.push(temp.x, temp.y, temp.z);
            vertexListSphere.push(temp2.x, temp2.y, temp2.z);
            normalListSphere.push(temp2.x, temp2.y, temp2.z);
            vertexListSphere.push(temp3.x, temp3.y, temp3.z);
            normalListSphere.push(temp3.x, temp3.y, temp3.z);
            vertexListSphere.push(temp3.x, temp3.y, temp3.z);
            normalListSphere.push(temp3.x, temp3.y, temp3.z);
            vertexListSphere.push(temp2.x, temp2.y, temp2.z);
            normalListSphere.push(temp2.x, temp2.y, temp2.z);
            vertexListSphere.push(temp4.x, temp4.y, temp4.z);
            normalListSphere.push(temp4.x, temp4.y, temp4.z);
        }
    }

    return [vertexList, normalList, vertexListSphere, normalListSphere];
}

function vertexBall(long, lat, r) {
    return {
        x: r * Math.cos(long) * Math.sin(lat),
        y: r * Math.sin(long) * Math.sin(lat),
        z: r * Math.cos(lat)
    }
}

function vertex(u, t, ti) {
    let x = ((0.8 + t * Math.cos(0.2 * Math.PI) + 2 * Math.pow(t, 2) * Math.sin(0.2 * Math.PI)) * Math.cos(u)) / ti,
        y = ((0.8 + t * Math.cos(0.2 * Math.PI) + 2 * Math.pow(t, 2) * Math.sin(0.2 * Math.PI)) * Math.sin(u)) / ti,
        z = (-t * Math.sin(0.2 * Math.PI) + 2 * Math.pow(t, 2) * Math.cos(0.2 * Math.PI)) / ti;
    return { x: x, y: y, z: z }
}

function cross(a, b) {
    let x = a.y * b.z - b.y * a.z;
    let y = a.z * b.x - b.z * a.x;
    let z = a.x * b.y - b.x * a.y;
    return { x: x, y: y, z: z }
}

function normalization(a) {
    var len = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
    a.x /= len; a.y /= len; a.z /= len;
}

/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iAttribNormal = gl.getAttribLocation(prog, "normal");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iNormalMatrix = gl.getUniformLocation(prog, "NormalMatrix");
    shProgram.iColor = gl.getUniformLocation(prog, "color");
    shProgram.iTime = gl.getUniformLocation(prog, "t");
    shProgram.iLight = gl.getUniformLocation(prog, "lighting");

    surface = new Model('Surface');
    let sur = CreateSurfaceData();
    surface.BufferData(sur[0], sur[1]);

    sphereSurface = new Model('Sphere');

    sphereSurface.BufferData(sur[2], sur[3]);

    gl.enable(gl.DEPTH_TEST);
}


/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type Error is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 * The second and third parameters are strings that contain the
 * source code for the vertex shader and for the fragment shader.
 */
function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vShader);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
    }
    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}


/**
 * initialization function that will be called when the page has loaded
 */
function init() {
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        if (!gl) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    spaceball = new TrackballRotator(canvas, draw, 0);

    repeatDraw();
}