const puppeteer = require('puppeteer');
const notifier = require('node-notifier'); // Para notificações no Windows

// Lista de domínios de sites de notícias conhecidos
const DOMINIOS_NOTICIAS = [
    "bbc.com",
    "nytimes.com",
    "globo.com",
    "uol.com.br",
    "folha.com.br",
    "cnn.com",
    "reuters.com",
    "estadao.com.br",
    "g1.globo.com",
    "elpais.com"
];

// Array para armazenar links já notificados
const linksNotificados = [];

// Função para detectar links em um texto
function detectarLinks(texto) {
    const regex = /http[s]?:\/\/[^\s]+/g;
    return texto.match(regex) || [];
}

// Função para filtrar links de notícias
function filtrarLinksNoticias(links) {
    return links.filter(link => {
        const dominio = new URL(link).hostname;
        return DOMINIOS_NOTICIAS.some(site => dominio.includes(site));
    });
}

// Função para notificar no Windows
function notificarWindows(mensagem) {
    notifier.notify({
        title: 'Alerta de Notícia',
        message: mensagem,
        sound: true, // Toca um som ao notificar
        wait: true // Aguarda o usuário interagir com a notificação
    });
}

// Função principal para monitorar o WhatsApp Web
async function monitorarWhatsapp() {
    const browser = await puppeteer.launch({ headless: false }); // Abre o navegador
    const page = await browser.newPage();

    try {
        // Abre o WhatsApp Web
        await page.goto('https://web.whatsapp.com');
        console.log('Escaneie o QR Code para logar no WhatsApp Web...');

        // Aguarda o usuário logar
        console.log('Aguardando o login...');
        await page.waitForSelector('div[aria-label="Lista de conversas"]', { timeout: 180000 }); // Aguarda até 180 segundos
        console.log('Logado no WhatsApp Web!');

        // Monitora novas mensagens
        while (true) {
            // Localiza os links nas mensagens
            const links = await page.$$eval('a[href]', elements => elements.map(el => el.href));

            // Verifica cada link
            const linksNoticias = filtrarLinksNoticias(links);

            if (linksNoticias.length > 0) {
                console.log('Links de notícias detectados:');
                linksNoticias.forEach(link => {
                    if (!linksNotificados.includes(link)) { // Verifica se o link já foi notificado
                        console.log(link);
                        notificarWindows(`⚠️ Essa notícia pode conter fake news: ${link}`);
                        linksNotificados.push(link); // Adiciona o link à lista de notificados
                    }
                });
            }

            // Aguarda alguns segundos antes de verificar novamente
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await browser.close();
    }
}

// Executa o monitoramento
monitorarWhatsapp();