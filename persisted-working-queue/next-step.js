"use strict";
/* 
 * Next step:
 * Create some mock steps. From 1 to 8 we are going to
 * create some steps with and added delay of 500 ms
 */
function nextStep(state) {
    var len = nextStep.steps.length,
        currentStep, i;
    for (i = 0; i < len; i++) {
        currentStep = nextStep.steps[i];
        if (!currentStep.done(state)) {
            return currentStep;
        }
    }
}

nextStep.steps = [1, 2, 3, 4, 5, 6, 7, 8].map(function (x, i, arr) {
  i++;
    return {
        name: 'Step ' + i,
        done: function (state) {
            return state['step' + i];
        },
        executeStep: function (state, cb) {
            setTimeout(function (state, step, cb) {
                state[step] = true;
                return cb(null, state);
            }, 500, state, 'step' + i, cb);
        },
        progress: Math.ceil((100/ arr.length ) * i)
    };
});

exports = module.exports = nextStep;
