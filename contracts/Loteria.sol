pragma solidity ^0.4.24;

contract Loteria {
    
    address public propietario;
    uint public pozoAcumulado;
    uint64 internal semillaActual;
    uint public inicioRonda;
    uint public numBloqueSorteo;
    uint public idRondaActual;
    address[] public participantes;
    mapping (address => bool) public participantesExistentes;
    mapping (address => uint) public depositos;
    uint constant COSTO_TRANSFERENCIA = 2300;
    uint constant TIEMPO_MAXIMO = 80;
    event Deposito(address desde, uint monto, uint idRonda);
    event Sorteo(address ganador, uint monto, uint idRonda, uint numGanador);
    
    constructor() public {
        propietario = msg.sender;
        pozoAcumulado = 0;
        semillaActual = 0;
        idRondaActual = 0;
        inicioRonda = block.timestamp;
        numBloqueSorteo = block.number;
    }
    
    function () public payable {
        depositar();
    }
    
    function depositar() public payable {
        require(msg.value > 0, "El monto a depositar debe ser mayor a cero");
        if (block.timestamp - inicioRonda >= TIEMPO_MAXIMO && pozoAcumulado == 0) {
            reiniciarRonda();
        }
        require(block.timestamp - inicioRonda < TIEMPO_MAXIMO, "La ronda anterior aun no se ha completado");
        depositos[msg.sender] += msg.value;
        if (!participantesExistentes[msg.sender]) {
            participantesExistentes[msg.sender] = true;
            participantes.push(msg.sender);
        }
        pozoAcumulado += msg.value;
        semillaActual = uint64(keccak256(keccak256(msg.sender, semillaActual)));
        emit Deposito(msg.sender, msg.value, idRondaActual);
    }

    function sortearPozo() public;
    
    function reiniciarRonda() internal {
        pozoAcumulado = 0;
        for (uint i = 0 ; i < participantes.length; i++) {
            delete depositos[participantes[i]];
            delete participantesExistentes[participantes[i]];
        }
        inicioRonda = block.timestamp;
        numBloqueSorteo = block.number;
        delete participantes;
    }
    
    function cancelarLoteria() public {
        require(msg.sender == propietario, "Solo el creador puede cancelar el contrato");
        uint precioTransferencia = COSTO_TRANSFERENCIA * tx.gasprice;
        uint montoDevolucion;
        for (uint i = 0 ; i < participantes.length; i++) {
            montoDevolucion = depositos[participantes[i]] - precioTransferencia;
            if (montoDevolucion > 0) {
                participantes[i].transfer(montoDevolucion);
            }
        }
        selfdestruct(propietario);
    }

    function tiempoRestanteRonda() public view returns(uint) {
        uint tiempoTranscurrido = block.timestamp - inicioRonda;
        uint tiempoRestante = TIEMPO_MAXIMO - tiempoTranscurrido;
        return tiempoRestante >= 0 && tiempoRestante <= TIEMPO_MAXIMO ? tiempoRestante : 0;
    }
    
}