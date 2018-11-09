import * as React from 'react';
import Cmd, { Dispatch, Sub } from './cmd';

export interface IProgram<Model, Msg> {
    arg?: any,
    init: (a?: any) => [Model, Cmd<Msg>],
    update: (msg: Msg) => (model: Model) => [Model, Cmd<Msg>],
    view: (dispatch: Dispatch<Msg>) => (model: Model) => React.ReactNode,
    subscribe?: (model: Model) => Cmd<Msg>,
}

export class ElmishComponent<Model, Msg> extends React.Component<{}, Model> {
    private program: IProgram<Model, Msg>;

    constructor(props: IProgram<Model, Msg>) {
        super({});
        this.program = props;
    }

    public componentWillMount() {
        const [model, cmd] = this.program.init(this.program.arg);
        this.setState(model, () => {
            cmd.forEach((sub: Sub<Msg>) => sub(this.dispatch));
            if (this.program.subscribe) {
                const cmd2 = this.program.subscribe(this.state);
                cmd2.forEach((sub: Sub<Msg>) => sub(this.dispatch));
            }
        });
    }

    public dispatch = (msg: Msg) => {
        let cmd: Cmd<Msg> = Cmd.none;
        this.setState((prevState: Model) => {
            const [model, cmd2] = this.program.update(msg)(prevState);
            cmd = cmd2;
            return model;
        }, () => {
            cmd.forEach((sub: Sub<Msg>) => sub(this.dispatch));
        });
    }

    public render = () => this.program.view(this.dispatch)(this.state)
}

export default ElmishComponent;