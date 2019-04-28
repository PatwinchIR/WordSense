import React from 'react';
import { Button, InputGroup } from "@blueprintjs/core";

class LoginForm extends React.Component {
  state = {
    username: '',
    password: ''
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
      <form onSubmit={e => this.props.handleLogin(e, this.state)} className="login-form">
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
         <Button
            intent={"success"}
            text={"Log In"}
            type="submit"
            disabled={this.state.password === "" || this.state.username === ""}
        />
      </form>
    );
  }
}

export default LoginForm;