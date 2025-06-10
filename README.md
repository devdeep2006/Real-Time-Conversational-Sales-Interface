# 🚀 Real-Time Conversational Sales Interface

## 🔍 Project Summary

The **Real-Time Conversational Sales Interface** is an AI-powered virtual agent designed to revolutionize customer communication through intelligent, real-time phone conversations. By combining natural language understanding, voice interaction, and real-time decision-making, it helps businesses engage, inform, and convert customers efficiently and effectively.

> 📖 Learn more: [Building an AI Sales Agent – dev.to](https://dev.to/devesh0099/building-an-ai-sales-agent-from-voice-to-pitch-3p6c)

---

## 🌟 Core Capabilities

- 🎧 **Live & Seamless Conversations**  
  Delivers real-time, low-latency audio interactions for responsive communication.

- 🧠 **Intelligent NLP Engine**  
  Uses natural language processing to understand context and respond accordingly.

- 🗣️ **Speech Recognition (STT)**  
  Transcribes user speech into text with high accuracy.

- 🗨️ **Voice Response Generation (TTS)**  
  Produces clear, human-like audio replies for a natural experience.

- 📊 **Sales-Focused Dialogue Strategy**  
  Trained for persuasive, goal-driven sales interactions.

- 🔌 **Modular API Integration**  
  Connects to third-party services (e.g., databases, CRMs) for real-time data access and analytics.

- 📈 **Scalable & Customizable**  
  Suitable for multiple industries and configurable to specific business needs.

---

## ⚠️ Known Limitations

- 🗣️ **Language Support**:  
  Currently supports only English.

- 💾 **Memory Constraints**:  
  Effective for short-to-medium conversations; limited to 8k tokens per session.

- ⚙️ **Computational Resources**:  
  Real-time performance depends on sufficient CPU/GPU availability.

- 🔗 **API Dependency**:  
  System behavior is affected by the reliability of integrated external APIs.

---

## Steps to Run

Follow these steps to install and run the AI Salesman:

1. **Clone the Repository**:

   ```bash
   git clone <repository_link>
   ```

   Replace `<repository_link>` with the URL of the repository.

2. **Navigate to the Project Directory**:

   ```bash
   cd AISalesman
   ```

3. **Create a Virtual Environment**:

   ```bash
   python -m venv env
   ```

   Activate the environment using:

   - On Windows: `env\Scripts\activate`
   - On macOS/Linux: `source env/bin/activate`

4. **Set Up Environment Variables**:

   Create a `.env` file in the project directory and add the following:

   ```env
   PINECONE_API=<your_pinecone_api_key>
   HUGGING_FACE_API=<your_hugging_face_api_key>
   SAMBANOVA_API_KEY=<your_sambanova_api_key>
   ```

   Replace `<your_api_key>` with the respective keys.

5. **Install Dependencies**:

   ```bash
   pip install -r requirements.txt
   ```

6. **Run the Application**:

   ```bash
   uvicorn web.main:app --host 0.0.0.0 --port 10000
   ```

   This command starts the application on port 10000, accessible at `http://0.0.0.0:10000`.

---

## License

📜 This project is licensed under the **GNU GENERAL PUBLIC LICENSE v3.0**.  
See the `LICENSE` file for additional details.
