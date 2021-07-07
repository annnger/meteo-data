/**
 * Simple state manager with proxy implementation
 *
 * @example
 * create state:
 * state = new State({
 *     prop1: 0,
 *     prop2: 0
 * });
 *
 *
 * subscribe on state changes
 * state.changes(state => {
 *     console.log(state)
 * })
 *
 * we can provide list of property keys endYearSelectElement observe
 * then, the call back fires when one of this props will be changed and
 * we will get the slice of the state with specified props
 *
 * state.changes(state => {
 *     console.log(state)
 * }, ['prop1'])
 *
 * change state
 * state.prop1 = 1
 * state.prop2 = 1
 */
export class State {
    _executors = [];

    _executeFn(fn, state) {
        fn(state);
    }

    _executePropsWatcher(state, changedProp, keyWatcher) {
        if (keyWatcher.observedProps.some(key => key === changedProp)) {
            keyWatcher.executor(keyWatcher.observedProps.reduce((acc, val) => {
                return {...acc, [val]: state[val]}
            }, {}));
        }
    }

    constructor(state) {
        const self = this;

        return new Proxy({
            state,
            changes(cb, propsToObserve) {
                if (propsToObserve) {
                    self._executors.push({observedProps: propsToObserve, executor: cb});
                    return;
                }

                self._executors.push(cb);
            },
        }, {
            set(target, prop, value) {
                target.state[prop] = value;
                self._executors.forEach(e => {
                    // to proper handle cases when we change state in the changes cb we need execute
                    // this cb after call stack is clear
                    setTimeout(() => {
                        if (typeof e === 'function') {
                            self._executeFn(e(target.state));
                            return;
                        }

                        if (typeof e === 'object') {
                            self._executePropsWatcher(target.state, prop, e);
                        }
                    })
                })

                return true;
            },

            get(t, p, ) {
                if (p === 'changes') {return t[p]}
                return t.state[p];
            }
        })
    }
}
