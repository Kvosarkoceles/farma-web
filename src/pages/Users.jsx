import React from 'react';
import ResourceTablePage from '@/components/common/ResourceTablePage';
import { usersAPI } from '@/services/api';
import StatusChip from '@/components/common/StatusChip';

const columns = [
    { key: 'id', label: 'ID' },
    { key: 'username', label: 'Usuario' },
    { key: 'role', label: 'Rol', format: (value) => <StatusChip status={value} /> },
    { key: 'created_at', label: 'Creado' },
];

const Users = () => {
    return (
        <ResourceTablePage
            title="Usuarios"
            subtitle="Administracion de usuarios del sistema"
            loadData={usersAPI.getAll}
            columns={columns}
        />
    );
};

export default Users;
