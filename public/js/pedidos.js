var pedidos = [];
var productosDisponibles = [];
var detallePedido = [];
var cantidadMaxima = 1000000;

$(function() {
    cargarClientes();
    cargarVendedores();
    cargarProductos();
    listarPedidos();

    $('#btnNuevoPedido').on('click', nuevoPedido);
    $('#btnGuardarPedido').on('click', guardarPedido);
    $('#btnAgregarItem').on('click', agregarItem);
    $('#id_producto').on('change', function() {
        actualizarPrecio();
        actualizarEstadoAgregar();
    });
    $('#cantidad').on('input', function() {
        validarCantidad(false);
    });
    $('#cantidad').on('blur', function() {
        validarCantidad(true);
    });
    actualizarEstadoAgregar();

    $('#tablaPedidos').on('click', '.js-editar-pedido', function() {
        editarPedido($(this).data('id'));
    });
    $('#tablaPedidos').on('click', '.js-eliminar-pedido', function() {
        eliminarPedido($(this).data('id'));
    });
    $('#tablaPedidos').on('click', '.js-cambiar-estatus-pedido', function() {
        cambiarEstatusPedido($(this).data('id'));
    });
    $('#tablaDetallePedido').on('click', '.js-eliminar-item', function() {
        eliminarItem($(this).data('index'));
    });
});

function escaparHtml(valor) {
    return $('<div>').text(valor === null || valor === undefined ? '' : valor).html();
}

function mostrarErrorPedido(mensaje) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: mensaje || 'No se pudo completar la operación.'
    });
}

function mostrarErrorAjax(xhr, mensaje) {
    var respuesta = xhr.responseJSON || {};
    mostrarErrorPedido(respuesta.message || mensaje);
}

function cargarClientes() {
    $.ajax({
        url: 'app/controllers/OrdenController.php',
        type: 'POST',
        dataType: 'json',
        data: { action: 'clientes' }
    }).done(function(respuesta) {
        if (!respuesta.success) {
            mostrarErrorPedido(respuesta.message || 'No se pudieron cargar los clientes.');
            return;
        }

        var opciones = '<option value="">Seleccione un cliente</option>';
        $.each(respuesta.data, function(indice, cliente) {
            opciones += '<option value="' + cliente.id + '">' +
                escaparHtml(cliente.nombre + ' ' + cliente.apellido) + '</option>';
        });
        $('#id_cliente').html(opciones);
    }).fail(function(xhr) {
        mostrarErrorAjax(xhr, 'No se pudieron cargar los clientes.');
    });
}

function cargarVendedores() {
    $.ajax({
        url: 'app/controllers/OrdenController.php',
        type: 'POST',
        dataType: 'json',
        data: { action: 'vendedores' }
    }).done(function(respuesta) {
        if (!respuesta.success) {
            mostrarErrorPedido(respuesta.message || 'No se pudieron cargar los vendedores.');
            return;
        }

        var opciones = '<option value="">Seleccione un vendedor</option>';
        $.each(respuesta.data, function(indice, vendedor) {
            opciones += '<option value="' + vendedor.id + '">' +
                escaparHtml(vendedor.nombre + ' ' + vendedor.apellido) + '</option>';
        });
        $('#id_vendedor').html(opciones);
    }).fail(function(xhr) {
        mostrarErrorAjax(xhr, 'No se pudieron cargar los vendedores.');
    });
}

function cargarProductos() {
    $.ajax({
        url: 'app/controllers/PedidoController.php',
        type: 'POST',
        dataType: 'json',
        data: { action: 'productos' }
    }).done(function(respuesta) {
        if (!respuesta.success) {
            mostrarErrorPedido(respuesta.message || 'No se pudieron cargar los productos.');
            return;
        }

        productosDisponibles = respuesta.data;
        var opciones = '<option value="">Seleccione un producto</option>';
        $.each(productosDisponibles, function(indice, producto) {
            var descripcion = producto.nombre;
            if (producto.presentacion || producto.medida) {
                descripcion += ' (' + [producto.presentacion, producto.medida].filter(Boolean).join(' ') + ')';
            }
            opciones += '<option value="' + producto.id + '">' + escaparHtml(descripcion) + '</option>';
        });
        $('#id_producto').html(opciones);
    }).fail(function(xhr) {
        mostrarErrorAjax(xhr, 'No se pudieron cargar los productos.');
    });
}

function listarPedidos() {
    $.ajax({
        url: 'app/controllers/PedidoController.php',
        type: 'POST',
        dataType: 'json',
        data: { action: 'ordenes' }
    }).done(function(respuesta) {
        if (!respuesta.success) {
            $('#tablaPedidos tbody').html('<tr><td colspan="8">No se pudieron cargar los pedidos.</td></tr>');
            mostrarErrorPedido(respuesta.message || 'No se pudieron cargar los pedidos.');
            return;
        }

        pedidos = respuesta.data;
        if (!pedidos.length) {
            $('#tablaPedidos tbody').html('<tr><td colspan="8">No hay pedidos registrados.</td></tr>');
            return;
        }

        var filas = '';
        $.each(pedidos, function(indice, pedido) {
            var cambiarEstatus = Number(pedido.id_estatus) === 1
                ? '<button type="button" class="btn bg-green btn-circle waves-effect waves-circle waves-float js-cambiar-estatus-pedido" title="Cambiar estatus" data-id="' + pedido.id + '">' +
                    '<i class="material-icons">sync_alt</i></button> '
                : '';

            filas += '<tr>' +
                '<td>' + escaparHtml(pedido.id) + '</td>' +
                '<td>' + escaparHtml(pedido.cliente || '-') + '</td>' +
                '<td>' + escaparHtml(pedido.vendedor || '-') + '</td>' +
                '<td>' + escaparHtml(pedido.fecha || '-') + '</td>' +
                '<td>' + escaparHtml(pedido.productos || 0) + '</td>' +
                '<td>$' + escaparHtml(pedido.total || 0) + '</td>' +
                '<td>' + escaparHtml(pedido.estatus || '-') + '</td>' +
                '<td><div class="d-flex gap-2">' +
                    cambiarEstatus +
                    '<button type="button" class="btn bg-deep-orange btn-circle waves-effect waves-circle waves-float js-editar-pedido" title="Editar pedido" data-id="' + pedido.id + '">' +
                        '<i class="material-icons">mode_edit</i></button> ' +
                    '<button type="button" class="btn bg-red btn-circle waves-effect waves-circle waves-float js-eliminar-pedido" title="Eliminar pedido" data-id="' + pedido.id + '">' +
                        '<i class="material-icons">delete</i></button>' +
                '</div></td>' +
                '</tr>';
        });
        $('#tablaPedidos tbody').html(filas);
    }).fail(function(xhr) {
        $('#tablaPedidos tbody').html('<tr><td colspan="8">No se pudieron cargar los pedidos.</td></tr>');
        mostrarErrorAjax(xhr, 'No se pudieron cargar los pedidos.');
    });
}

function nuevoPedido() {
    $('#formPedido')[0].reset();
    limpiarValidacionCantidad();
    $('#id_pedido').val('');
    $('#id_estatus').val('1');
    var hoy = new Date();
    var fecha = hoy.getFullYear() + '-' +
        String(hoy.getMonth() + 1).padStart(2, '0') + '-' +
        String(hoy.getDate()).padStart(2, '0');
    $('#fecha').val(fecha);
    detallePedido = [];
    $('#tituloFormularioPedido').text('Nuevo pedido');
    $('#precio_unitario').val('');
    mostrarDetalle();
    $('#modalPedido').modal('show');
}

function editarPedido(id) {
    var pedido = pedidos.find(function(item) {
        return String(item.id) === String(id);
    });

    if (!pedido) {
        mostrarErrorPedido('No se encontró el pedido seleccionado. Actualiza la lista e inténtalo nuevamente.');
        return;
    }

    $('#formPedido')[0].reset();
    limpiarValidacionCantidad();
    $('#id_pedido').val(pedido.id);
    $('#id_cliente').val(pedido.id_cliente);
    $('#id_vendedor').val(pedido.id_vendedor);
    $('#fecha').val(pedido.fecha);
    $('#id_estatus').val(pedido.id_estatus);
    $('#tituloFormularioPedido').text('Editar pedido');
    detallePedido = [];
    mostrarDetalle();
    $('#modalPedido').modal('show');

    $.ajax({
        url: 'app/controllers/PedidoController.php',
        type: 'POST',
        dataType: 'json',
        data: { action: 'detalle', id_pedido: id }
    }).done(function(respuesta) {
        if (!respuesta.success) {
            mostrarErrorPedido(respuesta.message || 'No se pudo cargar el detalle del pedido.');
            return;
        }

        detallePedido = [];
        respuesta.data.forEach(function(item) {
            var nombre = item.producto;
            if (item.presentacion || item.medida) {
                nombre += ' (' + [item.presentacion, item.medida].filter(Boolean).join(' ') + ')';
            }
            sumarProductoDetalle({
                id_producto: item.id_producto,
                cantidad: Number(item.cantidad),
                precio_unitario: Number(item.precio_unitario),
                nombre: nombre
            });
        });
        mostrarDetalle();
    }).fail(function(xhr) {
        mostrarErrorAjax(xhr, 'No se pudo cargar el detalle del pedido.');
    });
}

function actualizarPrecio() {
    var producto = productosDisponibles.find(function(item) {
        return String(item.id) === String($('#id_producto').val());
    });
    $('#precio_unitario').val(producto ? producto.precio : '');
}

function agregarItem() {
    var idProducto = $('#id_producto').val();
    var cantidad = Number($('#cantidad').val());
    var producto = productosDisponibles.find(function(item) {
        return String(item.id) === String(idProducto);
    });

    if (!producto) {
        mostrarErrorPedido('Selecciona un producto.');
        return;
    }
    if (!validarCantidad(true)) {
        mostrarErrorPedido('La cantidad debe ser un número entero mayor que cero.');
        $('#cantidad').focus();
        return;
    }

    var nombre = producto.nombre;
    if (producto.presentacion || producto.medida) {
        nombre += ' (' + [producto.presentacion, producto.medida].filter(Boolean).join(' ') + ')';
    }
    var productoDetalle = {
        id_producto: producto.id,
        cantidad: cantidad,
        precio_unitario: Number(producto.precio),
        nombre: nombre
    };

    if (!sumarProductoDetalle(productoDetalle)) {
        mostrarErrorPedido('La cantidad total del producto no puede superar ' + cantidadMaxima + '.');
        return;
    }

    $('#id_producto').val('');
    $('#cantidad').val('1');
    validarCantidad(false);
    $('#precio_unitario').val('');
    mostrarDetalle();
}

function sumarProductoDetalle(producto) {
    if (!Number.isSafeInteger(producto.cantidad) ||
        producto.cantidad <= 0 ||
        producto.cantidad > cantidadMaxima) {
        return false;
    }

    var existente = detallePedido.find(function(item) {
        return String(item.id_producto) === String(producto.id_producto);
    });

    if (!existente) {
        detallePedido.push(producto);
        return true;
    }

    var cantidadTotal = existente.cantidad + producto.cantidad;
    if (!Number.isSafeInteger(cantidadTotal) || cantidadTotal > cantidadMaxima) {
        return false;
    }

    var subtotal = existente.cantidad * existente.precio_unitario +
        producto.cantidad * producto.precio_unitario;
    existente.cantidad = cantidadTotal;
    existente.precio_unitario = subtotal / cantidadTotal;
    return true;
}

function validarCantidad(mostrarErrorVacio) {
    var valor = $('#cantidad').val();
    var valida = Validaciones.numeroEnteroPositivo(valor);
    var $linea = $('#cantidad').closest('.form-line');
    var $error = $('#error-cantidad');

    if (valida) {
        $linea.css('border-bottom', '2px solid #4CAF50');
        $error.hide();
        actualizarEstadoAgregar();
        return true;
    }

    if (valor === '' && !mostrarErrorVacio) {
        $linea.css('border-bottom', '');
        $error.hide();
        actualizarEstadoAgregar();
        return false;
    }

    $linea.css('border-bottom', '2px solid #F44336');
    $error.show();
    actualizarEstadoAgregar();
    return false;
}

function actualizarEstadoAgregar() {
    var productoSeleccionado = $('#id_producto').val() !== '';
    var cantidadValida = Validaciones.numeroEnteroPositivo($('#cantidad').val());
    $('#btnAgregarItem').prop('disabled', !productoSeleccionado || !cantidadValida);
}

function limpiarValidacionCantidad() {
    $('#cantidad').closest('.form-line').css('border-bottom', '');
    $('#error-cantidad').hide();
    actualizarEstadoAgregar();
}

function mostrarDetalle() {
    if (!detallePedido.length) {
        $('#tablaDetallePedido').html('<tr><td colspan="5">Agrega productos al pedido.</td></tr>');
        return;
    }

    var filas = '';
    $.each(detallePedido, function(indice, item) {
        var subtotal = item.cantidad * item.precio_unitario;
        filas += '<tr>' +
            '<td>' + escaparHtml(item.nombre) + '</td>' +
            '<td>' + item.cantidad + '</td>' +
            '<td>$' + item.precio_unitario + '</td>' +
            '<td>$' + subtotal.toFixed(2) + '</td>' +
            '<td><button type="button" class="btn bg-red btn-circle waves-effect waves-circle waves-float js-eliminar-item" title="Eliminar producto" data-index="' + indice + '">' +
                '<i class="material-icons">delete</i></button></td>' +
            '</tr>';
    });
    $('#tablaDetallePedido').html(filas);
}

function eliminarItem(indice) {
    detallePedido.splice(indice, 1);
    mostrarDetalle();
}

function guardarPedido() {
    var formulario = $('#formPedido')[0];
    if (!formulario.checkValidity()) {
        formulario.reportValidity();
        return;
    }
    if (!detallePedido.length) {
        mostrarErrorPedido('Agrega al menos un producto antes de guardar el pedido.');
        return;
    }

    $('#btnGuardarPedido').prop('disabled', true);
    $.ajax({
        url: 'app/controllers/PedidoController.php',
        type: 'POST',
        dataType: 'json',
        data: {
            action: 'guardar',
            id: $('#id_pedido').val(),
            id_cliente: $('#id_cliente').val(),
            id_vendedor: $('#id_vendedor').val(),
            fecha: $('#fecha').val(),
            id_estatus: $('#id_estatus').val(),
            detalle: detallePedido
        }
    }).done(function(respuesta) {
        if (!respuesta.success) {
            mostrarErrorPedido(respuesta.message || 'No se pudo guardar el pedido.');
            return;
        }

        $('#modalPedido').modal('hide');
        listarPedidos();
        Swal.fire({
            icon: 'success',
            title: '¡Excelente!',
            text: respuesta.message || 'Pedido guardado correctamente.',
            showConfirmButton: false,
            timer: 2000
        });
    }).fail(function(xhr) {
        mostrarErrorAjax(xhr, 'No se pudo guardar el pedido.');
    }).always(function() {
        $('#btnGuardarPedido').prop('disabled', false);
    });
}

function eliminarPedido(id) {
    Swal.fire({
        title: '¿Eliminar este pedido?',
        text: 'Se eliminarán también los productos asociados. Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then(function(resultado) {
        if (!resultado.isConfirmed) {
            return;
        }

        $.ajax({
            url: 'app/controllers/PedidoController.php',
            type: 'POST',
            dataType: 'json',
            data: { action: 'eliminar', id: id }
        }).done(function(respuesta) {
            if (!respuesta.success) {
                mostrarErrorPedido(respuesta.message || 'No se pudo eliminar el pedido.');
                return;
            }
            listarPedidos();
            Swal.fire('Eliminado', respuesta.message || 'Pedido eliminado correctamente.', 'success');
        }).fail(function(xhr) {
            mostrarErrorAjax(xhr, 'No se pudo eliminar el pedido.');
        });
    });
}

function cambiarEstatusPedido(id) {
    Swal.fire({
        title: 'Cambiar estatus del pedido',
        input: 'select',
        inputOptions: {
            2: 'Entregado/Listo',
            3: 'Cancelado'
        },
        inputPlaceholder: 'Seleccione un estatus',
        showCancelButton: true,
        confirmButtonText: 'Cambiar estatus',
        cancelButtonText: 'Cancelar'
    }).then(function(resultado) {
        if (!resultado.isConfirmed || !resultado.value) {
            return;
        }

        $.ajax({
            url: 'app/controllers/PedidoController.php',
            type: 'POST',
            dataType: 'json',
            data: {
                action: 'cambiarEstatus',
                id: id,
                id_estatus: resultado.value
            }
        }).done(function(respuesta) {
            if (!respuesta.success) {
                mostrarErrorPedido(respuesta.message || 'No se pudo cambiar el estatus.');
                return;
            }
            listarPedidos();
            Swal.fire('Actualizado', respuesta.message || 'Estatus actualizado correctamente.', 'success');
        }).fail(function(xhr) {
            mostrarErrorAjax(xhr, 'No se pudo cambiar el estatus.');
        });
    });
}
