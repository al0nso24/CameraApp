import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Linking, Text, View, Button, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CLAVE = 'ultimaFoto';
const CLAVE_FECHA = 'fechaFoto';
const SIGUIENTE_FLASH = { off: 'on', on: 'auto', auto: 'off' };

export default function App() {
  //Estado del permiso: null | { granted, canAskAgain, ... }
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState(null); //URI de la foto mostrada
  const [mensaje, setMensaje] = useState(''); //confirmación al guardar
  const [facing, setFacing] = useState('back'); //empieza con la cámara trasera
  const [flash, setFlash] = useState('off'); //flash apagado por defecto
  const [fecha, setFecha] = useState(''); //la fecha que se mostrará como texto
  const cameraRef = useRef(null); //referencia a la cámara

  //Recuperar la última foto al iniciar la app
  useEffect(() => {
    const cargarFoto = async () => {
      //Busca la dirección de la última foto guardada
      const savedPhoto = await AsyncStorage.getItem(CLAVE);
      if (savedPhoto) setPhoto(savedPhoto);

      //Guarda la fecha de la última foto guardada
      const savedFecha = await AsyncStorage.getItem(CLAVE_FECHA);
      if (savedFecha) setFecha(savedFecha);
    };
    cargarFoto();
  }, []);

  //Tomar y guardar foto
  const takePicture = async () => {
    if (!cameraRef.current) return; //confirma que exista cámara
    try {
      //Le pide a la cámara que tome la foto (calidad = 70%)
      const data = await cameraRef.current.takePictureAsync({ quality: 0.7 });

      //Obtiene la hora y fecha actual
      const ahora = new Date().toLocaleString('es-PE');
      setPhoto(data.uri); //data.uri = dirección local
      setFecha(ahora);

      //Guarda la dirección y la fecha en el dispositivo
      await AsyncStorage.setItem(CLAVE, data.uri);
      await AsyncStorage.setItem(CLAVE_FECHA, ahora);
      setMensaje('✔ Foto guardada'); //mensaje de confirmación
      setTimeout(() => setMensaje(''), 2000); //desaparece después de 2 segundos
    } catch (error) {
      console.log('Error al tomar la foto:', error);
    }
  };

  //Alternar cámara (trasera/frontal) y flash
  //Si facing = back, lo cambia a front
  //Si facing = front, lo cambia a back
  //actual representa el valor que tenía el estado justo antes del cambio
  const cambiarCamara = () => setFacing((actual) => (actual === 'back' ? 'front' : 'back'));

  //Si actual = off, busca SIGUIENTE_FLASH.off, que vale on
  const cambiarFlash = () => setFlash((actual) => SIGUIENTE_FLASH[actual]);

  //Se consulta el permiso
  if (!permission) {
    return (
      <View style={styles.centro}>
        <Text>Solicitando permiso...</Text>
      </View>
    );
  }

  //Sin permiso: mensaje de advertencia y botón
  if (!permission.granted) {
    return (
      <View style={styles.centro}>
        <Text style={styles.aviso}>Se necesita permiso de cámara</Text>
        {permission.canAskAgain ? (
          <Button title="Dar permiso" onPress={requestPermission} />
        ) : (
          <Button title="Abrir ajustes" onPress={() => Linking.openSettings()} />
        )}
      </View>
    );
  }

  //Permiso concedido
  return (
    <View style={styles.contenedor}>
      {/*
        ? = "si se cumple"
        : = "si no"
      */}
      {!photo ? (
        <CameraView
          ref={cameraRef}
          style={styles.camara}
          facing={facing} //indica si es cámara frontal o trasera
          flash={flash} //modo de flash
        />
      ) : (
        <Image source={{ uri: photo }} style={styles.camara} />
      )}
      {mensaje !== '' && <Text style={styles.toast}>{mensaje}</Text>}
      {photo && fecha !== '' && <Text style={styles.fecha}> {fecha}</Text>}
      <View style={styles.barra}>
        {!photo && (
          <View style={styles.fila}>
            <Button title={`⚡ Flash: ${flash}`} onPress={cambiarFlash} />
            <Button title="Cambiar cámara" onPress={cambiarCamara} />
          </View>
        )}
        <Button
          title={photo ? 'Volver a cámara' : 'Tomar foto'}
          onPress={() => (photo ? setPhoto(null) : takePicture())}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },

  aviso: {
    fontSize: 16,
    color: '#B00020',
    marginBottom: 12
  },

  contenedor: {
    flex: 1,
    backgroundColor: '#313131',
    paddingBottom: 20,
    paddingTop: 50
  },

  camara: {
    flex: 1
  },

  barra: {
    padding: 16,
    paddingBottom: 40
  },

  toast: {
    position: 'absolute', 
    top: 60, 
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)', 
    color: '#fff',
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 16,
  },

  fila: {
    flexDirection: 'row', //uno al lado del otro
    justifyContent: 'space-between',
    marginBottom: 10
  },

  fecha: {
    color: '#fff',
    textAlign: 'center',
    padding: 8,
    fontSize: 15
  },
});
