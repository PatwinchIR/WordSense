import React from 'react';
import { Text, Button, InputGroup } from "@blueprintjs/core";

class SignupForm extends React.Component {
  state = {
    username: '',
    password: '',
      confirmedPassword:''
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
    return [
      <form onSubmit={e => this.props.handleSignup(e, this.state)} className="signup-form">
        <h4>Sign Up</h4>
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
          <label htmlFor="password">Confirm Password</label>
          <InputGroup
          type="password"
          name="confirmedPassword"
          value={this.state.confirmedPassword}
          onChange={this.handleChange}
        />
        <Button
            intent={"primary"}
            text={"Sign Up"}
            type="submit"
            disabled={this.state.password === "" || this.state.password !== this.state.confirmedPassword}
        />
      </form>,
        (this.state.password !== this.state.confirmedPassword && <Text>error</Text>)
    ];
  }
}

export default SignupForm;