const axios = require('axios');
const fs = require('fs');
const path = require('path');
const forge = require('node-forge');
const https = require('https');

// Конфигурация Balance API
const BALANCE_API_CONFIG = {
  username: 'ТерехинНА',
  password: '123455123',
  apiUrl: 'https://cloud.mda-medusa.ru/mda-trade/hs/Api/BalanceData',
  credentials: Buffer.from('ТерехинНА:123455123').toString('base64')
};

// Путь к сертификату
const CERT_PATH = path.join(process.cwd(), '..', 'certs', 'terehin_n.cloud.mda-medusa.ru.p12');
const CERT_PASSWORD = '000000000';

// Функция инициализации HTTPS агента с сертификатом
function initializeHttpsAgent() {
  try {
    console.log(`🔍 Проверка сертификата по пути: ${CERT_PATH}`);
    
    if (!fs.existsSync(CERT_PATH)) {
      console.warn(`⚠️ Сертификат не найден: ${CERT_PATH}`);
      return null;
    }

    console.log('📄 Чтение сертификата...');
    const certBuffer = fs.readFileSync(CERT_PATH);
    const p12Der = forge.util.createBuffer(certBuffer.toString('binary'));
    const p12Asn1 = forge.asn1.fromDer(p12Der);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, CERT_PASSWORD);

    console.log('🔐 Извлечение ключей из сертификата...');
    // Извлекаем сертификат и приватный ключ
    let privateKey, certificate;
    const certBagType = forge.pki.oids.certBag;
    const keyBagType = forge.pki.oids.pkcs8ShroudedKeyBag;
    
    const certBags = p12.getBags({ bagType: certBagType });
    const keyBags = p12.getBags({ bagType: keyBagType });

    if (certBags[certBagType] && certBags[certBagType].length) {
      certificate = forge.pki.certificateToPem(certBags[certBagType][0].cert);
      console.log('✅ Сертификат извлечен');
    }

    if (keyBags[keyBagType] && keyBags[keyBagType].length) {
      privateKey = forge.pki.privateKeyToPem(keyBags[keyBagType][0].key);
      console.log('✅ Приватный ключ извлечен');
    }

    if (!certificate || !privateKey) {
      console.error('❌ Не удалось извлечь сертификат или ключ');
      return null;
    }

    // Настраиваем https агент с клиентским сертификатом
    return new https.Agent({
      rejectUnauthorized: true,
      cert: certificate,
      key: privateKey
    });
  } catch (error) {
    console.error('❌ Ошибка при инициализации HTTPS агента:', error.message);
    console.error('Stack:', error.stack);
    return null;
  }
}

// Функция для отправки запроса к Balance API
async function sendBalanceRequest(shopId, type = 'store_data') {
  try {
    console.log('\n' + '='.repeat(60));
    console.log(`🌐 Отправка запроса к Balance API`);
    console.log(`   Shop ID: ${shopId}`);
    console.log(`   Type: ${type}`);
    console.log(`   URL: ${BALANCE_API_CONFIG.apiUrl}`);
    console.log('='.repeat(60) + '\n');

    const httpsAgent = initializeHttpsAgent();
    if (!httpsAgent) {
      throw new Error('Не удалось инициализировать HTTPS агент с сертификатом');
    }

    // Подготавливаем данные для отправки
    const requestData = {
      shop_id: shopId,
      type: type
    };

    // Подготавливаем опции запроса с сертификатом
    const options = {
      httpsAgent: httpsAgent,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${BALANCE_API_CONFIG.credentials}`
      },
      timeout: 30000 // 30 секунд таймаут
    };

    // Отправляем запрос к API
    console.log(`📤 Отправка данных: ${JSON.stringify(requestData, null, 2)}\n`);
    const response = await axios.post(BALANCE_API_CONFIG.apiUrl, requestData, options);

    console.log('✅ Получен ответ от сервера!\n');
    console.log('📊 СТАТУС ОТВЕТА:', response.status, response.statusText);
    console.log('\n' + '='.repeat(60));
    console.log('📦 СТРУКТУРА ДАННЫХ:');
    console.log('='.repeat(60) + '\n');
    
    // Красиво выводим JSON
    console.log(JSON.stringify(response.data, null, 2));
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 АНАЛИЗ СТРУКТУРЫ:');
    console.log('='.repeat(60) + '\n');
    
    if (response.data) {
      console.log('Тип данных:', typeof response.data);
      console.log('Ключи верхнего уровня:', Object.keys(response.data));
      
      if (response.data.data) {
        console.log('\nВложенные данные (data):');
        console.log('  Тип:', typeof response.data.data);
        console.log('  Ключи:', Object.keys(response.data.data));
        
        if (response.data.data.items && Array.isArray(response.data.data.items)) {
          console.log('\n  Массив items:');
          console.log('    Количество элементов:', response.data.data.items.length);
          
          if (response.data.data.items.length > 0) {
            console.log('    Структура первого элемента:');
            console.log('      Ключи:', Object.keys(response.data.data.items[0]));
            console.log('\n    Первый элемент (пример):');
            console.log(JSON.stringify(response.data.data.items[0], null, 6));
          }
        }
        
        if (response.data.data.categories && Array.isArray(response.data.data.categories)) {
          console.log('\n  Массив categories:');
          console.log('    Количество категорий:', response.data.data.categories.length);
          
          if (response.data.data.categories.length > 0) {
            console.log('    Структура первой категории:');
            console.log('      Ключи:', Object.keys(response.data.data.categories[0]));
            console.log('\n    Первая категория (пример):');
            console.log(JSON.stringify(response.data.data.categories[0], null, 6));
          }
        }
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ТЕСТ ЗАВЕРШЕН УСПЕШНО');
    console.log('='.repeat(60) + '\n');

    return response.data;
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ ОШИБКА ПРИ ЗАПРОСЕ');
    console.error('='.repeat(60) + '\n');
    console.error('Сообщение:', error.message);
    
    if (error.response) {
      console.error('\n📥 Ответ сервера:');
      console.error('  Статус:', error.response.status);
      console.error('  Данные:', JSON.stringify(error.response.data, null, 2));
    }
    
    if (error.stack) {
      console.error('\n📚 Stack trace:');
      console.error(error.stack);
    }
    
    console.error('\n' + '='.repeat(60) + '\n');
    throw error;
  }
}

// Запуск теста
console.log('\n🚀 ЗАПУСК ТЕСТА API 1C\n');

sendBalanceRequest('1', 'store_data')
  .then(() => {
    console.log('🎉 Тест выполнен успешно!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Тест провален:', error.message);
    process.exit(1);
  });

