pragma solidity ^0.4.24;

contract LoteriaRetirable {
    
    address public propietario;
    uint public pozoAcumulado;
    uint64 semillaActual;
    uint public inicioRonda;
    uint public numBloqueSorteo;
    uint public idRondaActual;
    address[] public participantes;
    mapping (address => uint) public depositos;
    mapping (address => uint) public ganancias;
    uint constant COSTO_TRANSFERENCIA = 2300;
    uint constant TIEMPO_MAXIMO = 80;
    event Deposito(address desde, uint monto, uint idRonda);
    event Sorteo(address ganador, uint monto, uint idRonda);
    
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
        depositos[msg.sender] = msg.value;
        // POSIBLE BUG: Participante duplicado tiene mayores chances
        participantes.push(msg.sender);
        pozoAcumulado += msg.value;
        semillaActual = uint64(keccak256(keccak256(msg.sender, semillaActual)));
        emit Deposito(msg.sender, msg.value, idRondaActual);
    }
    
    function sortearPozo() public {
        require(block.timestamp - inicioRonda >= TIEMPO_MAXIMO && pozoAcumulado > 0, "El tiempo de la ronda aun no ha finalizado.");
        semillaActual = uint64(keccak256(keccak256(block.number, semillaActual)));
        uint numGanador = semillaActual % pozoAcumulado;
        registrarGanador(numGanador);
        idRondaActual++;
        reiniciarRonda();
    }
    
    function registrarGanador(uint numGanador) private {
        uint montoAcumulado = 0;
        address ganador;
        for (uint i = 0 ; i < participantes.length; i++) {
            montoAcumulado += depositos[participantes[i]];
            if (numGanador <= montoAcumulado) {
                ganador = participantes[i];
                break;
            }
        }
        ganancias[ganador] += pozoAcumulado;
        emit Sorteo(ganador, pozoAcumulado, idRondaActual);
    }

    function retirarFondos() public {
        uint montoGanado = ganancias[msg.sender];
        require(montoGanado > 0, "No posee fondos para retirar");
        ganancias[msg.sender] = 0;
        msg.sender.transfer(montoGanado);
    }
    
    function reiniciarRonda() private {
        pozoAcumulado = 0;
        for (uint i = 0 ; i < participantes.length; i++) {
            delete depositos[participantes[i]];
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