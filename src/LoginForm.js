import React from "react";
import { Button, Icon, InputGroup } from "@blueprintjs/core";
import { Link } from "react-router-dom";

class LoginForm extends React.Component {
  state = {
    username: "",
    password: ""
  };

  handleChange = e => {
    const name = e.target.name;
    const value = e.target.value;
    this.setState(prevstate => {
      const newState = { ...prevstate };
      newState[name] = value;
      return newState;
    });
  };

  render() {
    return (
      <form
        onSubmit={e => this.props.handleLogin(e, this.state)}
        className="auth-form"
      >
        <label htmlFor="username">Username</label>
        <InputGroup
          type="text"
          name="username"
          value={this.state.username}
          onChange={this.handleChange}
        />
        <label htmlFor="password">Password</label>
        <InputGroup
          type="password"
          name="password"
          value={this.state.password}
          onChange={this.handleChange}
        />
        <div className="actions">
          <Button
            intent={"success"}
            text={"Log In"}
            type="submit"
            disabled={this.state.password === "" || this.state.username === ""}
          />
          <Link to="/">
            <Icon icon="home" />
          </Link>
        </div>
      </form>
    );
  }
}

export default LoginForm;
