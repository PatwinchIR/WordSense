import React from "react";
import { Text, Button, InputGroup, Icon } from "@blueprintjs/core";
import { Link } from "react-router-dom";

class SignupForm extends React.Component {
  state = {
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    confirmedPassword: ""
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
        onSubmit={e => this.props.handleSignup(e, this.state)}
        className="auth-form"
      >
        <label htmlFor="username">Username</label>
        <InputGroup
          type="text"
          name="username"
          value={this.state.username}
          onChange={this.handleChange}
        />
        <label htmlFor="email">Email</label>
        <InputGroup
          type="text"
          name="email"
          value={this.state.email}
          onChange={this.handleChange}
        />
        <label htmlFor="first_name">First Name</label>
        <InputGroup
          type="text"
          name="first_name"
          value={this.state.first_name}
          onChange={this.handleChange}
        />
        <label htmlFor="last_name">Last Name</label>
        <InputGroup
          type="text"
          name="last_name"
          value={this.state.last_name}
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
        {this.state.password !== this.state.confirmedPassword && (
          <Text className="passwordconfirm">Password doesn't match.</Text>
        )}
        <div className="actions">
          <Button
            intent={"primary"}
            text={"Sign Up"}
            type="submit"
            disabled={
              this.state.password === "" ||
              this.state.password !== this.state.confirmedPassword
            }
          />
          <Link to="/">
            <Icon icon="home" />
          </Link>
        </div>
      </form>
    );
  }
}

export default SignupForm;
