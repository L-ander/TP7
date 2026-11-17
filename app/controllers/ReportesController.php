<?php

require_once '../core/BaseController.php';
require_once '../models/ReportesModel.php';

class ReportesController extends BaseController {
    private $modelo;

    public function __construct() {
        $this->modelo = new ReportesModel();
    }

    public function ejecutar($action, $data) {
        $method = lcfirst($action);

        if (method_exists($this, $method)) {
            return $this->$method($data);
        }

        return $this->jsonResponse([
            'success' => false,
            'message' => 'Acción no reconocida'
        ], 404);
    }

    protected function buscar($data) {
        $tipo = trim((string)($data['tipo'] ?? ''));
        $numeroPedido = trim((string)($data['numero_pedido'] ?? ''));

        if (!in_array($tipo, ['cliente', 'articulo', 'vendedor', 'fecha'], true)) {
            return $this->jsonResponse([
                'success' => false,
                'message' => 'Seleccione un tipo de reporte válido.'
            ], 422);
        }

        if ($numeroPedido !== '' && (filter_var($numeroPedido, FILTER_VALIDATE_INT) === false || (int)$numeroPedido <= 0)) {
            return $this->jsonResponse([
                'success' => false,
                'message' => 'El número de pedido debe ser un entero válido.'
            ], 422);
        }

        $fechaDesde = trim((string)($data['fecha_desde'] ?? ''));
        $fechaHasta = trim((string)($data['fecha_hasta'] ?? ''));

        if ($fechaDesde !== '' && !$this->fechaValida($fechaDesde)) {
            return $this->jsonResponse([
                'success' => false,
                'message' => 'La fecha desde no es válida.'
            ], 422);
        }

        if ($fechaHasta !== '' && !$this->fechaValida($fechaHasta)) {
            return $this->jsonResponse([
                'success' => false,
                'message' => 'La fecha hasta no es válida.'
            ], 422);
        }

        if ($fechaDesde !== '' && $fechaHasta !== '' && $fechaDesde > $fechaHasta) {
            return $this->jsonResponse([
                'success' => false,
                'message' => 'La fecha desde no puede ser mayor que la fecha hasta.'
            ], 422);
        }

        $resultado = $this->modelo->buscar($tipo, array(
            'numero_pedido' => $numeroPedido,
            'cliente' => trim((string)($data['cliente'] ?? '')),
            'cliente_id' => trim((string)($data['cliente_id'] ?? '')),
            'producto' => trim((string)($data['producto'] ?? '')),
            'producto_id' => trim((string)($data['producto_id'] ?? '')),
            'vendedor' => trim((string)($data['vendedor'] ?? '')),
            'vendedor_id' => trim((string)($data['vendedor_id'] ?? '')),
            'fecha_desde' => $fechaDesde,
            'fecha_hasta' => $fechaHasta
        ));

        if (!$resultado['success']) {
            return $this->jsonResponse([
                'success' => false,
                'message' => $resultado['error']
            ], 500);
        }

        return $this->jsonResponse([
            'success' => true,
            'data' => $resultado['datos']
        ]);
    }

    protected function opciones($data) {
        $resultado = $this->modelo->obtenerOpciones();

        if (!$resultado['success']) {
            return $this->jsonResponse([
                'success' => false,
                'message' => $resultado['error']
            ], 500);
        }

        return $this->jsonResponse([
            'success' => true,
            'data' => $resultado['datos']
        ]);
    }

    private function fechaValida($fecha) {
        $valor = DateTime::createFromFormat('!Y-m-d', $fecha);
        return $valor && $valor->format('Y-m-d') === $fecha;
    }
}

if (isset($_POST['action'])) {
    $controller = new ReportesController();
    $controller->ejecutar($_POST['action'], $_POST);
}
?>
