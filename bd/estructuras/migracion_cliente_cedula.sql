ALTER TABLE `cliente`
  ADD COLUMN `cedula` varchar(20) NULL AFTER `id`;

-- Asigne y normalice las cédulas existentes antes de activar restricción única.
ALTER TABLE `cliente`
  ADD UNIQUE KEY `uq_cliente_cedula` (`cedula`);
