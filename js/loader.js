class PrescricaoLoader {
    constructor() {
        this.prescricoes = { todas: [] };
        this.carregadas = false;
        this.categorias = ['urgencia', 'consulta', 'cronico', 'sazonal', 'neonatal', 'geriatria'];
    }

    async carregarTodasPrescricoes() {
        if (this.carregadas) return;
        
        console.log('🔄 Iniciando carregamento de prescrições...');
        
        try {
            // Carrega o manifest primeiro
            const manifest = await this.carregarManifest();
            
            // Carrega cada prescrição individualmente
            for (const [categoria, arquivos] of Object.entries(manifest)) {
                console.log(`📂 Carregando categoria: ${categoria}`);
                
                for (const arquivo of arquivos) {
                    await this.carregarPrescricaoIndividual(categoria, arquivo);
                }
                
                console.log(`✅ ${categoria}: ${arquivos.length} prescrições carregadas`);
            }
            
            this.carregadas = true;
            console.log(`🎉 Carregamento concluído! Total: ${this.prescricoes.todas.length} prescrições`);
            
        } catch (error) {
            console.error('❌ Erro ao carregar prescrições:', error);
            throw error;
        }
    }

    async carregarManifest() {
        try {
            const response = await fetch('./js/prescricoes/manifest.json');
            
            if (!response.ok) {
                throw new Error(`Manifest não encontrado: ${response.status}`);
            }
            
            const manifest = await response.json();
            console.log('📋 Manifest carregado:', Object.keys(manifest).length + ' categorias');
            return manifest;
            
        } catch (error) {
            console.error('❌ Erro ao carregar manifest:', error);
            throw new Error('Não foi possível carregar a lista de prescrições. Verifique se o manifest.json existe.');
        }
    }

    async carregarPrescricaoIndividual(categoria, nomeArquivo) {
        try {
            const response = await fetch(`./js/prescricoes/${categoria}/${nomeArquivo}`);
            
            if (!response.ok) {
                throw new Error(`Arquivo não encontrado: ${response.status}`);
            }
            
            const prescricao = await response.json();
            
            // Validação básica
            if (!prescricao.id || !prescricao.nome || !prescricao.conteudo) {
                throw new Error(`Prescrição inválida: ${nomeArquivo}`);
            }
            
            // Adiciona metadados
            const prescricaoCompleta = {
                ...prescricao,
                categoriaArquivo: categoria,
                arquivoOrigem: `${categoria}/${nomeArquivo}`,
                carregadoEm: new Date().toISOString()
            };
            
            this.prescricoes.todas.push(prescricaoCompleta);
            
        } catch (error) {
            console.warn(`⚠️ Erro ao carregar ${categoria}/${nomeArquivo}:`, error.message);
            throw error;
        }
    }

    getPrescricoes() {
        return this.prescricoes;
    }

    buscarPorId(id) {
        return this.prescricoes.todas.find(p => p.id === id);
    }

    getPrescricoesPorCategoria(categoria) {
        return this.prescricoes.todas.filter(p => p.categoriaArquivo === categoria);
    }

    getTotalPrescricoes() {
        return this.prescricoes.todas.length;
    }

    getEstatisticas() {
        const estatisticas = {
            total: this.prescricoes.todas.length,
            porCategoria: {},
            porFaixa: {},
            porTipo: {}
        };
        
        this.prescricoes.todas.forEach(presc => {
            // Por categoria
            estatisticas.porCategoria[presc.categoria] = 
                (estatisticas.porCategoria[presc.categoria] || 0) + 1;
            
            // Por faixa etária
            estatisticas.porFaixa[presc.faixa] = 
                (estatisticas.porFaixa[presc.faixa] || 0) + 1;
            
            // Por tipo
            estatisticas.porTipo[presc.tipo] = 
                (estatisticas.porTipo[presc.tipo] || 0) + 1;
        });
        
        return estatisticas;
    }
}

// Instância global
const loader = new PrescricaoLoader();
