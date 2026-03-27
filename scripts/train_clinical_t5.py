import torch
from datasets import load_dataset
from transformers import (
    AutoModelForSeq2SeqLM,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
    DataCollatorForSeq2Seq,
)
from peft import LoraConfig, get_peft_model, TaskType

# 1. Load Dataset (EkaCare Structured Clinical Notes)
print("Loading EkaCare dataset from Hugging Face...")
dataset = load_dataset("ekacare/eka-structured-clinical-note-generation")

model_id = "google/flan-t5-small"
tokenizer = AutoTokenizer.from_pretrained(model_id)
model = AutoModelForSeq2SeqLM.from_pretrained(model_id)

# 2. Preprocessing
def preprocess_function(examples):
    inputs = ["Task: Generate a clinical note from the following conversation: " + doc for doc in examples["transcription"]]
    model_inputs = tokenizer(inputs, max_length=512, truncation=True)
    
    # Target is the structured JSON/Note
    with tokenizer.as_target_tokenizer():
        labels = tokenizer(examples["clinical_note"], max_length=256, truncation=True)
    
    model_inputs["labels"] = labels["input_ids"]
    return model_inputs

tokenized_dataset = dataset.map(preprocess_function, batched=True)

# 3. LoRA Configuration (Fine-tuning technique for efficiency)
peft_config = LoraConfig(
    r=16,
    lora_alpha=32,
    target_modules=["q", "v"],
    lora_dropout=0.05,
    bias="none",
    task_type=TaskType.SEQ_2_SEQ_LM
)

model = get_peft_model(model, peft_config)
model.print_trainable_parameters()

# 4. Training Arguments
training_args = TrainingArguments(
    output_dir="./flan-t5-clinical-eka",
    evaluation_strategy="epoch",
    learning_rate=3e-4,
    per_device_train_batch_size=8,
    per_device_eval_batch_size=8,
    weight_decay=0.01,
    save_total_limit=3,
    num_train_epochs=3,
    predict_with_generate=True,
    push_to_hub=False,
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_dataset["train"],
    eval_dataset=tokenized_dataset["test"] if "test" in tokenized_dataset else tokenized_dataset["train"].select(range(10)),
    tokenizer=tokenizer,
    data_collator=DataCollatorForSeq2Seq(tokenizer, model=model),
)

# 5. Start Training
print("Starting fine-tuning...")
trainer.train()

# 6. Export for Transformers.js
print("Exporting model...")
model.save_pretrained("./final_clinical_model")
# To use in Transformers.js, you'll need to convert to ONNX using Optimum.
