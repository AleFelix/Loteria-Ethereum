pragma solidity ^0.4.24;

import "./Loteria.sol";

contract LoteriaNormal is Loteria {
    
    function sortearPozo() public {
        require(block.timestamp - inicioRonda >= TIEMPO_MAXIMO && pozoAcumulado > 0, "El tiempo de la ronda aun no ha finalizado.");
        semillaActual = uint64(keccak256(keccak256(block.number, semillaActual)));
        uint numGanador = semillaActual % pozoAcumulado;
        pagarGanador(numGanador);
        idRondaActual++;
        reiniciarRonda();
    }
    
    function pagarGanador(uint numGanador) private {
        uint montoAcumulado = 0;
        address ganador;
        for (uint i = 0; i < participantes.length; i++) {
            montoAcumulado += depositos[participantes[i]];
            if (numGanador <= montoAcumulado) {
                ganador = participantes[i];
                break;
            }
        }
        ganador.transfer(pozoAcumulado);
        emit Sorteo(ganador, pozoAcumulado, idRondaActual, numGanador);
    }

    function cancelarLoteria() public {
        require(msg.sender == propietario, "Solo el creador puede cancelar el contrato");
        require(pozoAcumulado == 0, "Para cancelar el contrato, el pozo debe estar vacío");
        selfdestruct(propietario);
    }
    
}