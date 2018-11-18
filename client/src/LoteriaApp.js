import React, { Component } from "react";
import LoteriaContract from "./contracts/Loteria.json";
import getWeb3 from "./utils/getWeb3";
import truffleContract from "truffle-contract";
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Icon from '@material-ui/core/Icon';
import Grid from '@material-ui/core/Grid';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import ListSubheader from '@material-ui/core/ListSubheader';

import "./LoteriaApp.css";

function HeaderLista(props) {
  return (
    <ListSubheader>
      <Grid container>
        <Grid item xs>
          <ListItemText primary={props.columna1} />
        </Grid>
        <Grid item xs>
          <ListItemText primary={props.columna2} />
        </Grid>
      </Grid>
    </ListSubheader>
  );
}

function ItemListaDepositos(props) {
  return (
    <ListItem button divider key={props.listKey}>
      <Grid container>
        <Grid item xs>
          <ListItemText primary={props.direccion} />
        </Grid>
        <Grid item xs align="right">
          <ListItemText primary={props.monto + " ETH"} />
        </Grid>
      </Grid>
    </ListItem>
  );
}

function AlertDialog(props) {

  const handleClose = () => {
    props.onChange(false);
  };

  return (
      <div>
        <Dialog
          open={props.open}
          onClose={handleClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">{props.title}</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              {props.description}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="primary" autoFocus>
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }

class LoteriaApp extends Component {
  state = {
    web3: null,
    accounts: null,
    contract: null,
    depositosRealizados: [],
    sorteosRealizados: [],
    depositosTotales: [],
    montoADepositar: '',
    isModalOpen: false,
    pozoAcumulado: 0,
    tiempoRestante: null,
    modalTitle: "",
    modalDesc: ""
  };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const Contract = truffleContract(LoteriaContract);
      Contract.setProvider(web3.currentProvider);
      const instance = await Contract.deployed();

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance }, this.runLoteria);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert('Failed to load web3, accounts, or contract. Check console for details.');
      console.log(error);
    }
  };

  runLoteria = () => {
    const contract = this.state.contract;

    //const depositoEvent = contract.Deposito({}, {fromBlock: 0});
    //const sorteoEvent = contract.Sorteo({}, {fromBlock: 0});

    contract.numBloqueSorteo.call().then((res) => {
      this.observarCambios(res.toString());
    });

    this.obtenerTiempoRestante();

    this.interval = setInterval(() => {this.obtenerTiempoRestante()}, 5000);
  };

  obtenerTiempoRestante = () => {
    const contract = this.state.contract;

    contract.tiempoRestanteRonda.call().then((res) => {
      this.setState({tiempoRestante: res.toString()});
    });
  };

  observarCambios = (numBloqueInicioRonda) => {
    const { web3, contract } = this.state;

    if (this.events) {
      this.events.stopWatching();
    } else {
      this.events = contract.allEvents({fromBlock: 0});
    }
    
    this.events.watch((err, res) => {
      if (err) {
        console.log(err);
      } else {
        console.log(res);
        const monto = web3.utils.fromWei(res.args.monto.toString(), 'ether');
        if (res.event === "Deposito") {
          const itemDepositosTotales = <ItemListaDepositos
            key={this.state.depositosTotales.length}
            listKey={this.state.depositosTotales.length}
            direccion={res.args.desde}
            monto={monto}
          />;
          this.setState(prevState => ({
            depositosTotales: [itemDepositosTotales].concat(prevState.depositosTotales)
          }));
          if (res.blockNumber >= numBloqueInicioRonda) {
            const itemDepositosRealizados = <ItemListaDepositos
              key={this.state.depositosRealizados.length}
              listKey={this.state.depositosRealizados.length}
              direccion={res.args.desde}
              monto={monto}
            />;
            this.setState(prevState => ({
              depositosRealizados: [itemDepositosRealizados].concat(prevState.depositosRealizados)
            }));
          }
        }
        if (res.event === "Sorteo") {
          const itemDepositosRealizados = <ItemListaDepositos
            key={this.state.sorteosRealizados.length}
            listKey={this.state.sorteosRealizados.length}
            direccion={res.args.ganador}
            monto={monto}
          />;
          const separadorRonda = (
            <ListItem button divider key={this.state.depositosTotales.length}>
              <Grid container>
                <Grid item xs align="center">
                  <ListItemText primary={"Ronda " + res.args.idRonda + " Finalizada - Total: " + monto + " ETH"} />
                </Grid>
              </Grid>
            </ListItem>
          );
          this.setState(prevState => ({
            sorteosRealizados: [itemDepositosRealizados].concat(prevState.sorteosRealizados),
            depositosRealizados: [],
            depositosTotales: [separadorRonda].concat(prevState.depositosTotales)
          }));
        }
        contract.pozoAcumulado.call().then((res) => {
          const monto = web3.utils.fromWei(res.toString(), 'ether');
          console.log(monto);
          this.setState({pozoAcumulado: monto});
        });
      }
    });

  };

  handleChanges = parametroModificado => event => {
    this.setState({
      [parametroModificado]: event.target.value,
    });
  };

  changeModal = (isModalOpen) => {
    this.setState({isModalOpen: isModalOpen});
  };

  showModal = (title, description) => {
    this.setState({
      isModalOpen: true,
      modalTitle: title,
      modalDesc: description
    });
  };

  depositarMonto = () => {
    if (this.state.montoADepositar > 0) {
      console.log("depositarMonto()");
      this.state.contract.depositar({
        from: this.state.accounts[0],
        value: this.state.web3.utils.toWei(this.state.montoADepositar, 'ether')
      }).then((res) => {
        this.showModal("Transacción realizada", "El monto ha sido enviado exitosamente.");
        console.log(res);
      }).catch((err) => {
        let message = err.message;
        if (message.includes("revert")) {
          message = message.split("revert")[1];
        }
        this.showModal("Error al intentar realizar la transacción", message);
        console.log(err);
      });
    } else {
      this.showModal("Error", "El monto a enviar debe ser mayor a cero.");
    }
  };

  sortearPozo = () => {
    this.state.contract.sortearPozo({
      from: this.state.accounts[0]
    }).then((res)=>{
      console.log(res);
      this.showModal("Transacción realizada", "El pozo ha sido sorteado exitosamente.");
    }).catch((err) => {
      let message = err.message;
      if (message.includes("revert")) {
        message = message.split("revert")[1];
      }
      this.showModal("Error al intentar sortear el pozo", message);
      console.log(err);
    });
  };

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <Grid className="container" container spacing={24}>
          <Grid item xs={12}>
            <Paper className="paper-space">
              <Typography variant="h5">
                Depositar
              </Typography>
              <form>
                <Grid container>
                  <Grid item xs={12}>
                    <TextField
                      label="Monto (Ether)"
                      value={this.state.montoADepositar}
                      onChange={this.handleChanges('montoADepositar')}
                      margin="normal"
                      variant="outlined"
                      />
                  </Grid>
                  <Grid item xs={12}>
                    <Button variant="contained" color="primary" onClick={this.depositarMonto}>
                      Depositar
                      <Icon className="icono">send</Icon>
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper className="paper-space">
              <Grid container>
                <Grid item xs={6}>
                  <Typography variant="h5">
                    Pozo Acumulado
                  </Typography>
                  <Typography component="p">
                    {this.state.pozoAcumulado + " ETH"}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h5">
                    Tiempo Restante
                  </Typography>
                  <Typography component="p">
                    {"~ " + this.state.tiempoRestante + " segundos"}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper className="paper-space">
              <Typography variant="h5">
                Sortear Pozo
              </Typography>
              <Button variant="contained" color="primary" onClick={this.sortearPozo}>
                Sortear
                <Icon className="icono">star</Icon>
              </Button>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper className="paper-space">
              <Typography variant="h5">
                Lista de Depositos en Ronda Actual
              </Typography>
              <HeaderLista columna1="Dirección" columna2="Monto" />
              <List className="listaDepositos" component="ul">
                {this.state.depositosRealizados}
              </List>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper className="paper-space">
              <Typography variant="h5">
                Lista de Sorteos Anteriores
              </Typography>
              <HeaderLista columna1="Ganador" columna2="Monto" />
              <List className="listaDepositos" component="ul">
                {this.state.sorteosRealizados}
              </List>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper className="paper-space">
              <Typography variant="h5">
                Historico de Depositos
              </Typography>
              <HeaderLista columna1="Dirección" columna2="Monto" />
              <List className="listaDepositos" component="ul">
                {this.state.depositosTotales}
              </List>
            </Paper>
          </Grid>
        </Grid>
        <AlertDialog
        open={this.state.isModalOpen}
        onChange={this.changeModal}
        title={this.state.modalTitle}
        description={this.state.modalDesc}
        />
      </div>
    );
  }
}

export default LoteriaApp;
