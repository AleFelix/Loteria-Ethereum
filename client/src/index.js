import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import LoteriaApp from './LoteriaApp';
import registerServiceWorker from './registerServiceWorker';
import CssBaseline from '@material-ui/core/CssBaseline';

ReactDOM.render(
<React.Fragment>
    <CssBaseline />
    <LoteriaApp />
</React.Fragment>,
document.getElementById('root'));
registerServiceWorker();
