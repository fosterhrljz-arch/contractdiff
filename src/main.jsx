import React from 'react';import {createRoot} from 'react-dom/client';import App from './AppV2.jsx';import './style-v2.css';
class ErrorBoundary extends React.Component{state={error:null};static getDerivedStateFromError(error){return {error};}render(){return this.state.error?<main><h1>ContractDiff could not start</h1><p>{this.state.error.message}</p><p>Extract the complete ZIP and open ContractDiff.html in Chrome or Edge.</p></main>:this.props.children;}}
createRoot(document.getElementById('root')).render(<ErrorBoundary><App/></ErrorBoundary>);


import './style-workspace.css';
