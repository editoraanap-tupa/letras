/* Configuração da plataforma Mundo Encantado.
   firebase: o bloco "firebaseConfig" do console do Firebase (não é senha; pode ficar no site).
   funcoes:  endereço das funções do Firebase (pagamento do Mercado Pago), depois do plano Blaze.
   Enquanto firebase for null, o site usa Pix manual e a área do administrador mostra pedidos de exemplo. */
window.ME_CONFIG = {
  firebase: {
    apiKey: 'AIzaSyDKL3tGVBxuKPxE-JZEInW_KZYi2bf_Iqo',
    authDomain: 'mundo-encantado-77c43.firebaseapp.com',
    projectId: 'mundo-encantado-77c43',
    storageBucket: 'mundo-encantado-77c43.firebasestorage.app',
    messagingSenderId: '582126300761',
    appId: '1:582126300761:web:bd075d574b4e8d5e410b48'
  },
  funcoes: null,          // ex.: 'https://southamerica-east1-mundo-encantado-77c43.cloudfunctions.net'
  admins: ['mundo.encantado.prof@gmail.com']
};
