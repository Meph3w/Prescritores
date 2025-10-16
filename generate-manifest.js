const fs = require('fs');
const path = require('path');

function gerarManifest() {
    const categorias = ['urgencia', 'consulta', 'cronico', 'sazonal', 'neonatal', 'geriatria'];
    const manifest = {};
    let totalArquivos = 0;

    console.log('🔍 Gerando manifest.json...\n');

    categorias.forEach(categoria => {
        const categoriaPath = path.join(__dirname, 'js', 'prescricoes', categoria);
        
        // Verifica se a pasta existe
        if (!fs.existsSync(categoriaPath)) {
            console.log(`📁 Criando pasta: ${categoria}`);
            fs.mkdirSync(categoriaPath, { recursive: true });
            manifest[categoria] = [];
            return;
        }

        // Lista todos os arquivos .json
        const files = fs.readdirSync(categoriaPath)
            .filter(file => file.endsWith('.json'))
            .sort();
            
        manifest[categoria] = files;
        totalArquivos += files.length;
        
        console.log(`✅ ${categoria}: ${files.length} prescrições`);
        files.forEach(file => console.log(`   📄 ${file}`));
    });

    // Salva o manifest
    const manifestPath = path.join(__dirname, 'js', 'prescricoes', 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    console.log(`\n🎉 Manifest atualizado com sucesso!`);
    console.log(`📊 Total: ${totalArquivos} prescrições em ${categorias.length} categorias`);
    
    // Cria um resumo para debug
    const resumo = {
        totalPrescricoes: totalArquivos,
        categorias: Object.keys(manifest).length,
        atualizadoEm: new Date().toISOString()
    };
    
    console.log('\n📋 Resumo:', resumo);
}

// Executa se chamado diretamente
if (require.main === module) {
    gerarManifest();
}

module.exports = gerarManifest;
