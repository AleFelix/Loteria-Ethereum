pragma solidity ^0.4.24;

import "./Loteria.sol";

contract LoteriaRetirable is Loteria {

    mapping (address => uint) public ganancias;
    
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
        for (uint i = 0; i < participantes.length; i++) {
            montoAcumulado += depositos[participantes[i]];
            if (numGanador <= montoAcumulado) {
                ganador = participantes[i];
                break;
            }
        }
        ganancias[ganador] += pozoAcumulado;
        emit Sorteo(ganador, pozoAcumulado, idRondaActual, numGanador);
    }

    function retirarFondos() public {
        uint montoGanado = ganancias[msg.sender];
        require(montoGanado > 0, "No posee fondos para retirar");
        ganancias[msg.sender] = 0;
        msg.sender.transfer(montoGanado);
    }

    function cancelarLoteria() public {
        require(msg.sender == propietario, "Solo el creador puede cancelar el contrato");
        require(pozoAcumulado == 0, "Para cancelar el contrato, el pozo debe estar vacío");
        for (uint i = 0; i < participantes.length; i++) {
            if (ganancias[participantes[i]] > 0) {
                revert("Aun quedan ganancias que no fueron reclamadas por los participantes");
            }
        }
        selfdestruct(propietario);
    }
    
}