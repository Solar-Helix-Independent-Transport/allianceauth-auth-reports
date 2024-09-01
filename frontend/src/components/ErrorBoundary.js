import { ErrorLoader } from "@pvyparts/allianceauth-components";
import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  componentDidCatch(error, errorInfo) {
    // Catch errors in any components below and re-render with error message
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
    // You can also log error messages to an error reporting service here
  }

  render() {
    if (this.state.errorInfo) {
      // Error path
      return (
        <ErrorLoader
          title="Error in API"
          message="Try refresh the page, If the error persists contact the Admins."
        />
      );
    }
    // Normally, just render children
    return this.props.children;
  }
}

export default ErrorBoundary;