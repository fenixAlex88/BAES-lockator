import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, Button, Modal, TouchableOpacity } from "react-native";
import MapView, { Polyline, Marker } from "react-native-maps";
import * as Location from "expo-location";
import Share from "react-native-share";

export default function App() {
    const [location, setLocation] = useState(null);
    const [track, setTrack] = useState([]);
    const [isTracking, setIsTracking] = useState(false);
    const [subscription, setSubscription] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const saveTrack = () => {
        // Здесь код для сохранения данных трека
        console.log("Track saved");
        setModalVisible(false);
    };

    const shareTrack = async () => {
        const trackData = JSON.stringify(track); // Преобразование данных трека в строку JSON
        try {
            await Share.open({
                title: "Поделиться треком",
                message: "Вот данные моего трека:",
                url: `data:text/plain;base64,${Buffer.from(trackData).toString("base64")}`,
                subject: "Мой трек", // для электронной почты
            });
        } catch (error) {
            console.log("Ошибка при попытке поделиться треком: ", error);
        }
        setModalVisible(false);
    };

    const startTracking = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
            console.log("Permission to access location was denied");
            return;
        }

        const newSubscription = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.BestForNavigation,
                timeInterval: 1000,
                distanceInterval: 0,
            },
            (newLocation) => {
                setLocation(newLocation.coords);
                setTrack((prevTrack) => [...prevTrack, newLocation.coords]);
            },
        );

        setSubscription(newSubscription);
        setIsTracking(true);
    };

    const stopTracking = () => {
        if (subscription) {
            subscription.remove();
            setSubscription(null);
        }
        setIsTracking(false);
        setModalVisible(true); // Показать модальное окно после остановки трекинга
    };

    useEffect(() => {
        return () => {
            if (subscription) {
                subscription.remove();
            }
        };
    }, [subscription]);

    return (
        <View style={styles.container}>
            {location && (
                <MapView
                    style={styles.map}
                    initialRegion={{
                        latitude: location.latitude,
                        longitude: location.longitude,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                    }}
                >
                    <Marker
                        coordinate={{ latitude: location.latitude, longitude: location.longitude }}
                    />
                    <Polyline coordinates={track} strokeWidth={5} />
                </MapView>
            )}
            {!location && <Text>Waiting for GPS signal...</Text>}
            <Button
                title={isTracking ? "Стоп" : "Старт"}
                onPress={isTracking ? stopTracking : startTracking}
            />
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(!modalVisible);
                }}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <TouchableOpacity style={styles.button} onPress={saveTrack}>
                            <Text>Сохранить трек</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.button} onPress={shareTrack}>
                            <Text>Поделиться треком</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
    },
    map: {
        width: "100%",
        height: "100%",
    },
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 22,
    },
    modalView: {
        margin: 20,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 35,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    button: {
        borderRadius: 20,
        padding: 10,
        elevation: 2,
        backgroundColor: "#2196F3",
        marginTop: 15,
    },
});
