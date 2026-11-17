//==========================================================================================
// AUDIO SETUP
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit just where you're asked to!
//------------------------------------------------------------------------------------------
//
//==========================================================================================
let dspNode = null; 
let dspNodeParams = null; 
let jsonParams = null; 
let accelerationBaselineZ = null; // Slowly updated resting Z acceleration for comparison.
let movementArmed = true; // Allows one bell strike until the phone settles and rearms.
let quietSince = null; // Time when the phone first entered the quiet/reset range.
const movementThreshold = 5; // Minimum Z acceleration change that triggers a strike.
const movementReleaseThreshold = 2; // Below this change, the phone counts as settled.
const quietRearmTime = 180; // Quiet time in milliseconds required before another strike.

const dspName = "churchBell"; // Must match the name of the loaded WASM DSP.
const instance = new FaustWasm2ScriptProcessor(dspName); // Faust processor wrapper.

// output to window or npm package module
if (typeof module === "undefined") {
    window[dspName] = instance;
} else {
    const exp = {};
    exp[dspName] = instance;
    module.exports = exp;
}

// The name should be the same as the WASM file, so change tuono with brass if you use brass.wasm
churchBell.createDSP(audioContext, 1024)
    .then(node => {
        dspNode = node;
        dspNode.connect(audioContext.destination);
        console.log('params: ', dspNode.getParams());
        const jsonString = dspNode.getJSON();
        jsonParams = JSON.parse(jsonString)["ui"][0]["items"];
        dspNodeParams = jsonParams
        // const exampleMinMaxParam = findByAddress(dspNodeParams, "/thunder/rumble");
        // // ALWAYS PAY ATTENTION TO MIN AND MAX, ELSE YOU MAY GET REALLY HIGH VOLUMES FROM YOUR SPEAKERS
        // const [exampleMinValue, exampleMaxValue] = getParamMinMax(exampleMinMaxParam);
        // console.log('Min value:', exampleMinValue, 'Max value:', exampleMaxValue);
    });


//==========================================================================================
// INTERACTIONS
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit the next functions to create interactions
// Decide which parameters you're using and then use playAudio to play the Audio
//------------------------------------------------------------------------------------------
//
//==========================================================================================

function accelerationChange(accx, accy, accz) {
    // Ignore unavailable sensor readings and use the first Z reading as the resting reference.
    if (!Number.isFinite(accz)) {
        return;
    }

    if (accelerationBaselineZ === null) {
        accelerationBaselineZ = accz;
        return;
    }

    const movement = accz - accelerationBaselineZ; // Signed change detects either direction.
    const movementMagnitude = Math.abs(movement);
    const now = performance.now();

    // Strike once on a large forward/backward move; wait for a brief return to quiet before rearming.
    if (movementArmed && movementMagnitude >= movementThreshold) {
        playAudio();
        movementArmed = false;
        quietSince = null;
    } else if (movementMagnitude < movementReleaseThreshold) {
        if (quietSince === null) {
            quietSince = now;
        } else if (now - quietSince >= quietRearmTime) {
            movementArmed = true;
        }

        // Follow gradual changes in the phone's resting orientation without absorbing sharp moves.
        accelerationBaselineZ += (accz - accelerationBaselineZ) * 0.02;
    } else {
        quietSince = null;
    }
}

function rotationChange(rotx, roty, rotz) {
    // Interaction 2 uses accelerationZ rather than rotation for forward/backward movement.
}

function mousePressed() {
    // playAudio()
}

function deviceMoved() {
    // Update the shared UI indicator when p5 detects movement.
    movetimer = millis();
    statusLabels[2].style("color", "pink");
}

function deviceTurned() {
    threshVals[1] = turnAxis;
}
function deviceShaken() {
    // Intentionally disabled: the acceleration threshold above controls bell playback.
    shaketimer = millis();
    statusLabels[0].style("color", "pink");
}

function getMinMaxParam(address) {
    // Look up and log the allowed range for a Faust control by its address.
    const exampleMinMaxParam = findByAddress(dspNodeParams, address);
    // ALWAYS PAY ATTENTION TO MIN AND MAX, ELSE YOU MAY GET REALLY HIGH VOLUMES FROM YOUR SPEAKERS
    const [exampleMinValue, exampleMaxValue] = getParamMinMax(exampleMinMaxParam);
    console.log('Min value:', exampleMinValue, 'Max value:', exampleMaxValue);
    return [exampleMinValue, exampleMaxValue]
}

//==========================================================================================
// AUDIO INTERACTION
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit here to define your audio controls 
//------------------------------------------------------------------------------------------
//
//==========================================================================================

function playAudio() {
    // Trigger the bell gate briefly; don't attempt playback before DSP/audio are ready.
    if (!dspNode) {
        return;
    }
    if (audioContext.state === 'suspended') {
        return;
    }
    dspNode.setParamValue("/churchBell/gate", 1)
    setTimeout(() => { dspNode.setParamValue("/churchBell/gate", 0) }, 100);
}

//==========================================================================================
// END
//==========================================================================================