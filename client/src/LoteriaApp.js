import React, { Component } from "react";
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import { blueGrey } from '@material-ui/core/colors';
import LoteriaNormalContract from "./contracts/LoteriaNormal.json";
import LoteriaRetirableContract from "./contracts/LoteriaRetirable.json";
import getWeb3 from "./utils/getWeb3";
import truffleContract from "truffle-contract";
import { List, ListSubheader, ListItemText, ListItem, Grid, Dialog,
  DialogTitle, DialogContent, DialogContentText, Button, DialogActions,
  Paper, Typography, TextField, Icon } from '@material-ui/core';

import "./LoteriaApp.css";

class HeaderLista extends Component {

  typographyProps = {
    variant: "h6"
  };

  generarItemsHeader = () => {
    const itemsHeader = [];
    for (let i = 0; i < this.props.columnas.length; i++) {
      itemsHeader.push(
        <Grid item sm={this.props.anchoColumnas[i]} key={i}>
          <ListItemText primaryTypographyProps={this.typographyProps} primary={this.props.columnas[i]} />
        </Grid>
      );
    }
    return itemsHeader;
  };

  render() {
    return (
      <ListSubheader component="div" className="header-lista">
        <Grid container>
          {this.generarItemsHeader()}
        </Grid>
      </ListSubheader>
    );
  }
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

function ItemListaSorteos(props) {
  return (
    <ListItem button divider key={props.listKey}>
      <Grid container>
        <Grid item md={1} align="center">
          <ListItemText primary={props.ronda} />
        </Grid>
        <Grid item md={6} align="center">
          <ListItemText primary={props.direccion} />
        </Grid>
        <Grid item md={2} align="center">
          <ListItemText primary={props.monto + " ETH"} />
        </Grid>
        <Grid item md={3} align="center">
          <ListItemText primary={props.numGanador} />
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

  constructor(props) {
    super(props);
    if (props.retirable) {
      this.state.fondosDisponibles = 0;
    }
  }

  theme = createMuiTheme({
    palette: {
      primary: blueGrey,
      background: {
        paper: "#fcf5ff"
      }
    },
    typography: {
      useNextVariants: true
    }
  });

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      let Contract;
      if (this.props.retirable) {
        Contract = truffleContract(LoteriaRetirableContract);
      } else {
        Contract = truffleContract(LoteriaNormalContract);
      }
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
          const itemSorteosRealizados = <ItemListaSorteos
            key={this.state.sorteosRealizados.length}
            listKey={this.state.sorteosRealizados.length}
            ronda={res.args.idRonda.toString()}
            direccion={res.args.ganador}
            monto={monto}
            numGanador={res.args.numGanador.toString()}
          />;
          const separadorRonda = (
            <ListItem button divider key={this.state.depositosTotales.length}>
              <Grid container>
                <Grid item xs align="center">
                  <ListItemText
                    primaryTypographyProps={{style:{fontWeight: "bold"}}}
                    primary={"Ronda " + res.args.idRonda + " Finalizada - Total: " + monto + " ETH"} 
                  />
                </Grid>
              </Grid>
            </ListItem>
          );
          this.setState(prevState => ({
            sorteosRealizados: [itemSorteosRealizados].concat(prevState.sorteosRealizados),
            depositosRealizados: [],
            depositosTotales: [separadorRonda].concat(prevState.depositosTotales)
          }));
          if (this.props.retirable) {
            this.state.contract.ganancias.call(this.state.accounts[0]).then((res) => {
              const monto = web3.utils.fromWei(res.toString(), 'ether');
              console.log("FONDOS DISPONIBLES");
              console.log(res);
              console.log(monto);
              this.setState({fondosDisponibles: monto});
            });
          }
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

  getMensajeDebug = (message) => {
    if (process.env.REACT_APP_GANACHE_DEBUG == "true" && message.includes("revert")) {
      return " | Mensaje: " + message.split("revert")[1];
    } else {
      return " | Mensaje: " + message;
    }
  };

  depositarMonto = () => {
    if (this.state.montoADepositar > 0) {
      console.log("depositarMonto()");
      console.log("Monto a Depositar: " + this.state.montoADepositar);
      console.log("En wei: " + this.state.web3.utils.toWei(this.state.montoADepositar, 'ether'));
      this.state.contract.depositar({
        from: this.state.accounts[0],
        value: this.state.web3.utils.toWei(this.state.montoADepositar, 'ether')
      }).then((res) => {
        this.showModal("Transacción realizada", "El monto ha sido enviado exitosamente.");
        console.log(res);
      }).catch((err) => {
        let message = "Verique que la ronda anterior haya finalizado y que el monto a depositar sea mayor a cero.";
        console.log(this.getMensajeDebug(err.message));
        this.showModal("Error al intentar realizar la transacción", message);
        console.log(err);
      });
    } else {
      this.showModal("Error", "El monto a enviar debe ser mayor a cero.");
    }
  };

  sortearPozo = () => {
    console.log("REACT_APP_GANACHE_DEBUG:");
    console.log(process.env.REACT_APP_GANACHE_DEBUG);
    this.state.contract.sortearPozo({
      from: this.state.accounts[0]
    }).then((res)=>{
      console.log(res);
      this.showModal("Transacción realizada", "El pozo ha sido sorteado exitosamente.");
    }).catch((err) => {
      let message = "Verique que el tiempo de la ronda actual no haya finalizado y que el pozo acumulado sea mayor a cero.";
      console.log(this.getMensajeDebug(err.message));
      this.showModal("Error al intentar sortear el pozo", message);
      console.log(err);
    });
  };

  retirarFondos = () => {
    const { web3, contract, accounts} = this.state;
    contract.retirarFondos({
      from: accounts[0]
    }).then((res) => {
      console.log(res);
      this.showModal("Transacción realizada", "Los fondos han sido retirados con exito.");
      contract.ganancias.call(accounts[0]).then((res) => {
        const monto = web3.utils.fromWei(res.toString(), 'ether');
        console.log("FONDOS DISPONIBLES");
        console.log(res);
        console.log(monto);
        this.setState({fondosDisponibles: monto});
      });
    }).catch((err) => {
      let message = "Verique que su cuenta posea fondos disponibles.";
      console.log(this.getMensajeDebug(err.message));
      this.showModal("Error al intentar retirar los fondos", message);
      console.log(err);
    });
  };

  mostrarPaneldeRetiroDeFondos = () => {
    if (this.props.retirable) {
      return(
        <Grid item xs={12}>
          <Paper className="paper-space">
            <Grid container>
              <Grid item xs={12}>
                <Typography variant="h5">
                  Fondos Disponibles
                </Typography>
                <Typography component="p">
                  {this.state.fondosDisponibles + " ETH"}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" color="primary" onClick={this.retirarFondos}>
                  Retirar
                  <Icon className="icono">attach_money</Icon>
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      );
    }
  };

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <MuiThemeProvider theme={this.theme}>
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
                      className="campo-texto"
                      label="Monto (Ether)"
                      value={this.state.montoADepositar}
                      onChange={this.handleChanges('montoADepositar')}
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
          {this.mostrarPaneldeRetiroDeFondos()}
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
                Lista de Depósitos en la Ronda Actual
              </Typography>
              <HeaderLista
                columnas={["Dirección", "Monto"]}
                anchoColumnas={[6,6]}
              />
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
              <HeaderLista
                columnas={["Ronda", "Ganador", "Monto", "Número"]}
                anchoColumnas={[1,6,2,3]}
              />
              <List className="listaDepositos" component="ul">
                {this.state.sorteosRealizados}
              </List>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper className="paper-space">
              <Typography variant="h5">
                Historial de Depósitos
              </Typography>
              <HeaderLista
                columnas={["Dirección", "Monto"]}
                anchoColumnas={[6,6]}
              />
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
      </MuiThemeProvider>
    );
  }
}

export default LoteriaApp;
