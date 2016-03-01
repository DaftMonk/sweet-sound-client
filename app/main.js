require('babel-polyfill');
require("./Assets/style.scss")
require("sweetalert2/dist/sweetalert2.css");
import React from 'react';
import { render } from 'react-dom';

import App from './App.js';

render(<App/>, document.getElementById('app'));
