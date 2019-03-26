import * as React from "react";
import { connect } from "react-redux";
import { Dispatch, putPicoBox, newPico, delPico } from "../../Action";
import { PicoBox, State, PicoDetails } from "../../State";
import { Link } from "react-router-dom";

interface PropsFromParent {
  pico: PicoBox;
}

interface Props extends PropsFromParent {
  dispatch: Dispatch;
  picoDetails?: PicoDetails;
}

function getRefVal(ref: React.RefObject<HTMLInputElement>) {
  return ref.current && ref.current.value;
}

class About extends React.Component<Props> {
  private input_name = React.createRef<HTMLInputElement>();
  private input_backgroundColor = React.createRef<HTMLInputElement>();

  private input_add_name = React.createRef<HTMLInputElement>();
  private input_add_backgroundColor = React.createRef<HTMLInputElement>();

  constructor(props: Props) {
    super(props);

    this.savePico = this.savePico.bind(this);
    this.addPico = this.addPico.bind(this);
  }

  savePico(e: React.FormEvent) {
    e.preventDefault();
    const name = getRefVal(this.input_name) || "";
    const backgroundColor = getRefVal(this.input_backgroundColor) || "";

    const { pico, dispatch } = this.props;

    dispatch(putPicoBox(pico.eci, { name, backgroundColor }));
  }

  addPico(e: React.FormEvent) {
    e.preventDefault();
    const name = getRefVal(this.input_add_name) || "";
    const backgroundColor = getRefVal(this.input_add_backgroundColor) || "";

    const { pico, dispatch } = this.props;

    dispatch(newPico(pico.eci, { name, backgroundColor }));
  }

  delPico(eci: string) {
    const { pico, dispatch } = this.props;
    dispatch(delPico(pico.eci, eci));
  }

  render() {
    const { pico } = this.props;

    return (
      <div>
        <h3>Pico</h3>
        <div>
          <b className="text-muted" title="This is the channel used by the UI">
            UI ECI:
          </b>{" "}
          <span className="text-mono">{pico.eci}</span>
        </div>

        <form className="form-inline" onSubmit={this.savePico}>
          <div className="form-group">
            <label className="sr-only">Name</label>
            <input
              type="text"
              className="form-control"
              defaultValue={pico.name}
              ref={this.input_name}
            />
          </div>
          <div className="form-group ml-1 mr-1">
            <label className="sr-only">Color</label>
            <input
              type="color"
              className="form-control p-0"
              style={{ width: 38 }}
              defaultValue={pico.backgroundColor}
              ref={this.input_backgroundColor}
            />
          </div>
          <button type="submit" className="btn btn-outline-primary">
            Save
          </button>
        </form>

        <h3 className="mt-3">Children</h3>

        {pico.children.length === 0 ? (
          <span className="text-muted">- no children -</span>
        ) : (
          <ul>
            {pico.children.map(eci => {
              return (
                <li key={eci}>
                  <Link to={"/pico/" + eci} className="text-mono mr-2">
                    {eci}
                  </Link>
                  |
                  <button
                    className="btn btn-link btn-sm"
                    type="button"
                    onClick={e => {
                      e.preventDefault();
                      this.delPico(eci);
                    }}
                  >
                    delete
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <form className="form-inline mt-2" onSubmit={this.addPico}>
          <div className="form-group">
            <label className="sr-only">Name</label>
            <input
              type="text"
              className="form-control"
              ref={this.input_add_name}
            />
          </div>
          <div className="form-group ml-1 mr-1">
            <label className="sr-only">Color</label>
            <input
              type="color"
              className="form-control p-0"
              style={{ width: 38 }}
              defaultValue={pico.backgroundColor}
              ref={this.input_add_backgroundColor}
            />
          </div>
          <button type="submit" className="btn btn-outline-primary">
            Add
          </button>
        </form>
      </div>
    );
  }
}

export default connect((state: State, props: PropsFromParent) => {
  const picoState = state.picos[props.pico.eci];
  return {
    picoDetails: picoState && picoState.details
  };
})(About);
