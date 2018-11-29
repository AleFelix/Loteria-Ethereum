import React from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import LoteriaApp from './LoteriaApp';
import LoteriaAppRetirable from './LoteriaAppRetirable';
import { Paper, Grid, Typography, Button } from "@material-ui/core";
import "./LoteriaApp.css";

const Indice = () => (
  <Grid className="container" container spacing={24}>
    <Grid item xs={12}>
      <Paper className="paper-space">
        <Grid container>
          <Grid item xs={12} align="center" style={{paddingBottom: "20px"}}>
            <Typography variant="h3">
              Seleccione el Tipo de Lotería
            </Typography>
          </Grid>
          <Grid item xs={6} align="center">
            <Button variant="contained" color="primary" href="normal">
              Normal
            </Button>
          </Grid>
          <Grid item xs={6} align="center">
            <Button variant="contained" color="primary" href="retirable">
              Retiro Manual
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Grid>
  </Grid>
);

const AppRouter = () => (
  <Router>
    <Switch>
      <Route exact path="/" component={Indice} />
      <Route path="/normal/" component={LoteriaApp} />
      <Route path="/retirable/" component={LoteriaAppRetirable} />
    </Switch>
  </Router>
);

export default AppRouter;
