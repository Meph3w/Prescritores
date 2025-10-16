class PrescricaoLoader {
    constructor() {
        this.prescricoes = { todas: [] };
        this.carregadas = false;
        this.categorias = ['urgencia', 'consulta', 'cronico', 'sazonal', 'neonatal', 'geriatria'];
    }

    async carregarTodasPrescricoes() {
        if (this.carregadas) return;
        
        console.log('🔄 Carregando prescrições...');
        
        for (const categoria of this.categorias) {
            try {
                await this.carregarPrescricoesCategoria(categoria);
                console.log(`✅ ${categoria}.json carregado`);
            } catch (error) {
                console.warn(`⚠️ ${categoria}.json não encontrado, ignorando...`);
            }
        }
        
        this.carregadas = true;
        console.log(`🎉 ${this.prescricoes.todas.length} prescrições carregadas automaticamente`);
    }

    async carregarPrescricoesCategoria(categoria) {
        const response = await fetch(`./js/prescricoes/${categoria}.json`);
        if (!response.ok) throw new Error('Arquivo não encontrado');
        
        const dados = await response.json();
        
        // Adiciona a categoria a cada prescrição para referência
        const prescricoesComCategoria = dados.prescricoes.map(presc => ({
            ...presc,
            categoriaArquivo: categoria
        }));
        
        this.prescricoes.todas.push(...prescricoesComCategoria);
    }

    getPrescricoes() {
        return this.prescricoes;
    }

    buscarPorId(id) {
        return this.prescricoes.todas.find(p => p.id === id);
    }

    buscarPorCategoria(categoria) {
        return this.prescricoes.todas.filter(p => p.categoriaArquivo === categoria);
    }

    getTotalPrescricoes() {
        return this.prescricoes.todas.length;
    }
}

// Instância global
const loader = new PrescricaoLoader();
