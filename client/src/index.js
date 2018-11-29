import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import CssBaseline from '@material-ui/core/CssBaseline';
import AppRouter from './AppRouter';

ReactDOM.render(
<React.Fragment>
    <CssBaseline />
    <AppRouter />
</React.Fragment>,
document.getElementById('root'));