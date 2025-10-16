// Funções para PDF e impressão
async function salvarComoPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const nomePaciente = document.getElementById('nomePaciente').value || '_________________________';
    const dataPrescricao = document.getElementById('dataPrescricao').value;
    const idadePaciente = document.getElementById('idadePaciente').value || '_________________________';
    
    const dataFormatada = dataPrescricao ? 
        new Date(dataPrescricao).toLocaleDateString('pt-BR') : 
        new Date().toLocaleDateString('pt-BR');
    
    // Converter HTML para imagem usando html2canvas
    const element = document.getElementById('editor');
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    
    doc.setFontSize(16);
    doc.setTextColor(99, 105, 209);
    doc.text('PRESCRIÇÃO MÉDICA', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Paciente: ${nomePaciente}`, 20, 40);
    doc.text(`Idade: ${idadePaciente}`, 20, 50);
    doc.text(`Data: ${dataFormatada}`, 20, 60);
    
    // Adicionar imagem do conteúdo
    const imgProps = doc.getImageProperties(imgData);
    const pdfWidth = doc.internal.pageSize.getWidth() - 40;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    doc.addImage(imgData, 'PNG', 20, 80, pdfWidth, pdfHeight);
    
    // Assinatura
    const finalY = 80 + pdfHeight + 20;
    doc.text('_________________________', 105, finalY, { align: 'center' });
    doc.text('Assinatura do Profissional', 105, finalY + 10, { align: 'center' });
    
    doc.save(`prescricao-${nomePaciente || 'paciente'}.pdf`);
}

function imprimirPrescricao() {
    const nomePaciente = document.getElementById('nomePaciente').value || '_________________________';
    const dataPrescricao = document.getElementById('dataPrescricao').value;
    const idadePaciente = document.getElementById('idadePaciente').value || '_________________________';
    const conteudoEditor = document.getElementById('editor').innerHTML;
    
    const dataFormatada = dataPrescricao ? 
        new Date(dataPrescricao).toLocaleDateString('pt-BR') : 
        new Date().toLocaleDateString('pt-BR');
    
    const conteudoImpressao = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Prescrição Médica</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 40px; 
                    line-height: 1.6;
                    color: #2c3e50;
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 30px;
                    border-bottom: 2px solid #6369D1;
                    padding-bottom: 20px;
                }
                .paciente-info {
                    margin: 20px 0;
                }
                .medicamento {
                    margin: 15px 0;
                    padding: 10px;
                    background: #f8f9fa;
                    border-radius: 5px;
                }
                .dosagem {
                    font-weight: bold;
                }
                .assinatura { 
                    text-align: center; 
                    margin-top: 100px; 
                }
                .linha-assinatura { 
                    border-top: 1px solid #000; 
                    width: 300px; 
                    margin: 40px auto 10px; 
                    padding-top: 15px;
                }
                .alerta {
                    background: #fff3cd;
                    padding: 10px;
                    border-radius: 5px;
                    margin: 10px 0;
                }
                .emergencia {
                    background: #f8d7da;
                    padding: 10px;
                    border-radius: 5px;
                    margin: 10px 0;
                }
                @media print {
                    body { margin: 20px; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>PRESCRIÇÃO MÉDICA</h1>
            </div>
            <div class="paciente-info">
                <p><strong>Paciente:</strong> ${nomePaciente}</p>
                <p><strong>Idade:</strong> ${idadePaciente}</p>
                <p><strong>Data:</strong> ${dataFormatada}</p>
            </div>
            <div class="conteudo">
                ${conteudoEditor}
            </div>
            <div class="assinatura">
                <div class="linha-assinatura"></div>
                <p>Assinatura do Profissional</p>
            </div>
        </body>
        </html>
    `;
    
    const janelaImpressao = window.open('', '_blank');
    janelaImpressao.document.write(conteudoImpressao);
    janelaImpressao.document.close();
    janelaImpressao.focus();
    janelaImpressao.print();
}
