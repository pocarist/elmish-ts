// tslint:disable:no-namespace
/// Dispatch - feed new message into the processing loop
// type Dispatch<'msg> = 'msg -> unit
type Dispatch<Msg> = (msg: Msg) => void;

/// Subscription - return immediately, but may schedule dispatch of a message at any time
// type Sub<'msg> = Dispatch<'msg> -> unit
type Sub<Msg> = (dispatch: Dispatch<Msg>) => void;

/// Cmd - container for subscriptions that may produce messages
// type Cmd<'msg> = Sub<'msg> list
type Cmd<Msg> = Array<Sub<Msg>>;


namespace Cmd {
    /// None - no commands, also known as `[]`
    // let none : Cmd<'msg> =
    //     []
    export const none = [];

    /// Command to issue a specific message
    // let ofMsg (msg:'msg) : Cmd<'msg> =
    //     [fun dispatch -> dispatch msg]
    export const ofMsg = <Msg>(msg: Msg): Cmd<Msg> => [(dispatch: Dispatch<Msg>) => dispatch(msg)];

    /// When emitting the message, map to another type
    // let map (f: 'a -> 'msg) (cmd: Cmd<'a>) : Cmd<'msg> =
    //     cmd |> List.map (fun g -> (fun dispatch -> f >> dispatch) >> g)
    export const map = <A, Msg>(f: (arg:A)=>Msg, cmd: Cmd<A>): Cmd<Msg> => 
        cmd.map((g:Sub<A>) => (dispatch:Dispatch<Msg>) => g((a:A) => dispatch(f(a))));

    /// Aggregate multiple commands
    // let batch (cmds: #seq<Cmd<'msg>>) : Cmd<'msg> =
    //     cmds |> List.concat
    export const batch = <Msg>(cmds: Array<Cmd<Msg>>): Cmd<Msg> => 
        cmds.reduce((acc, val) => acc.concat(val), []);


    /// Command to evaluate a simple function and map the result
    /// into success or error (of exception)
    // let ofFunc (task: 'a -> _) (arg: 'a) (ofSuccess: _ -> 'msg) (ofError: _ -> 'msg) : Cmd<'msg> =
    //     let bind dispatch =
    //         try
    //             task arg
    //             |> (ofSuccess >> dispatch)
    //         with x ->
    //             x |> (ofError >> dispatch)
    //     [bind]
    export const ofFunc = <A, Msg>(task: (a?:A)=>any, arg:A, ofSuccess: (_:any)=>Msg, ofError: (_:any)=>Msg): Cmd<Msg> => {
        const bind = (dispatch: Dispatch<Msg>) => {
            try {
                dispatch(ofSuccess(task(arg)))
            } catch (ex) {
                dispatch(ofError(ex))
            }
        };
        return [bind];
    }

    /// Command to evaluate a simple function and map the success to a message
    /// discarding any possible error
    // let performFunc (task: 'a -> _) (arg: 'a) (ofSuccess: _ -> 'msg) : Cmd<'msg> =
    //     let bind dispatch =
    //         try
    //             task arg
    //             |> (ofSuccess >> dispatch)
    //         with x ->
    //             ()
    //     [bind]
    export const performFunc = <A, Msg>(task: (a?:A)=>any, arg:A, ofSuccess: (_:any)=>Msg): Cmd<Msg> => {
        const bind = (dispatch: Dispatch<Msg>) => {
            try {
                dispatch(ofSuccess(task(arg)))
            } catch (_) {
                ;
            }
        };
        return [bind];
    }

    /// Command to evaluate a simple function and map the error (in case of exception)
    // let attemptFunc (task: 'a -> unit) (arg: 'a) (ofError: _ -> 'msg) : Cmd<'msg> =
    //     let bind dispatch =
    //         try
    //             task arg
    //         with x ->
    //             x |> (ofError >> dispatch)
    //     [bind]
    export const attemptFunc = <A, Msg>(task: (a?:A)=>any, arg:A, ofError: (_:any)=>Msg): Cmd<Msg> => {
        const bind = (dispatch: Dispatch<Msg>) => {
            try {
                task(arg)
            } catch (ex) {
                dispatch(ofError(ex))
            }
        };
        return [bind];
    }

    /// Command to call the subscriber
    // let ofSub (sub: Sub<'msg>) : Cmd<'msg> =
    //     [sub]
    export const ofSub = <Msg>(sub: Sub<Msg>): Cmd<Msg> => [sub];

    /// Command to call `promise` block and map the results
    // let ofPromise (task: 'a -> Fable.Import.JS.Promise<_>) 
    //                 (arg:'a) 
    //                 (ofSuccess: _ -> 'msg) 
    //                 (ofError: _ -> 'msg) : Cmd<'msg> =
    //     let bind dispatch =
    //         task arg
    //         |> Promise.map (ofSuccess >> dispatch)
    //         |> Promise.catch (ofError >> dispatch)
    //         |> ignore
    //     [bind]
    export const ofPromise = <A, Msg>(task: (a?:A)=>Promise<any>, arg:A, ofSuccess: (_:any)=>Msg, ofError: (_:any)=>Msg): Cmd<Msg> => {
        const bind = (dispatch: Dispatch<Msg>) => {
            task(arg)
            .then((val) => dispatch(ofSuccess(val)))
            .catch((ex) => dispatch(ofError(ex)))
        };
        return [bind];
    }
}

export default Cmd;
export {Dispatch, Sub, Cmd};
