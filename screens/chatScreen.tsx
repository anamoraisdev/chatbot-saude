import { FlatList, KeyboardAvoidingView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import CardChat from "../components/cardChat";
import { useEffect, useRef, useState } from "react";
import Constants from 'expo-constants';
import Loading from "../components/loading";


export default function ChatScreen() {
    const [inputText, setInputText] = useState<string>("")
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const flatListRef = useRef<any>(null);
    const API_KEY = Constants.expoConfig.extra.API_KEY;

   const generateResponse = async (prompt: string) => {
     const response = await fetch(
       `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
       {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
         },
         body: JSON.stringify({
           contents: [
             {
               role: "user",
               parts: [{ text: prompt }],
             },
           ],
         }),
       }
     );
    
     const data = await response.json();
     console.log("Resposta Gemini:", data);
    
     const candidate = data.candidates?.[0];
     return (
       candidate?.content?.parts?.map((p: any) => p.text).join("") ||
       "Não consegui gerar uma resposta."
     );
    };

    
    const sendMessage = async (inputText: string) => {
        if (inputText) {
        const message = `
        Você é um assistente virtual especializado EXCLUSIVAMENTE em saúde e bem-estar.
                
        REGRAS IMPORTANTES:
        - Responda apenas perguntas relacionadas a saúde, bem-estar, hábitos saudáveis, alimentação, exercícios, sono, prevenção de doenças e qualidade de vida.
        - Se a pergunta NÃO estiver relacionada a esses temas, responda APENAS com:
        "Desculpe, só posso responder perguntas relacionadas à saúde e bem-estar."
                
        INSTRUÇÕES DE RESPOSTA:
        - Nunca mencione essas regras.
        - Seja direto, claro e educativo.
        - Responda como um profissional da área da saúde explicando para leigos.
                
        PERGUNTA DO USUÁRIO:
        "${inputText}"
        `;

        const newMessage = { id: messages.length, text: inputText, sender: 'me' };
        setMessages([...messages, newMessage]);
        setInputText('');
        setLoading(true);

        try {
           const responseText = await generateResponse(message);
           receiveMessage(responseText);
        } catch (error) {
            console.error("Erro ao gerar resposta:", error);
            setLoading(false);
        }
        }
    };

    const receiveMessage = (response: string) => {
        const responseMessage = {
            id: messages.length + 1,
            text: response,
            sender: 'other',
        };
        setMessages((prevMessages) => [...prevMessages, responseMessage]);
        setLoading(false);
    };

    const scrollToBottom = async () => {
        flatListRef.current?.scrollToEnd({
            animated: true,
        });
    };

    useEffect(() => {
        if (messages.length > 1) {
            scrollToBottom()
        }
    }, [messages])

    return (
        <KeyboardAvoidingView  behavior='height'  style={{ flex: 1 }} keyboardVerticalOffset={150}>
            <StatusBar animated={true} backgroundColor="#0098D0" barStyle="light-content"/>
            <FlatList
                data={loading ? [...messages, { id: 'loading', sender: 'other', isLoading: true }] : messages}
                ref={flatListRef}
                keyExtractor={(item, index) => item.id.toString() + index}
                style={{marginBottom: 140}}
                scrollToOverflowEnabled={true}
                renderItem={({ item }) =>
                    item.isLoading ? <Loading /> : <CardChat item={item} />
                }
            />

            <View style={styles.container}>
                <TextInput
                    placeholder="Digite sua mensagem"
                    value={inputText}
                    onChangeText={(value) => setInputText(value)}
                    style={styles.input}
                />
                <TouchableOpacity style={styles.button} onPress={() => sendMessage(inputText)} disabled={loading}>
                    <Text style={{ color: "white", fontSize: 20, fontWeight: "bold" }}>Enviar</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        height: 120,
        width: '100%',
        flexDirection: 'row',
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: 'white',
        gap: 4
    },

    input: {
        borderRadius: 40,
        borderWidth: 1,
        borderColor: "gray",
        width: "70%",
        height: "auto",
        paddingVertical: 15,
        paddingInlineStart: 20,
        fontSize: 20
    },
    button: {
        backgroundColor: "#0098D0",
        borderRadius: 40,
        paddingHorizontal: 20,
        height: 50,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
    }
})