const { createApp } = require('./app');

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        const app = await createApp();
        app.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
        });
    } catch (error) {
    console.error('Erro ao iniciar o servidor:', error);
        process.exit(1);
    }
}

    startServer();