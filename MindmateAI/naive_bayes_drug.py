import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.naive_bayes import GaussianNB
from sklearn.metrics import accuracy_score

def main():
    # Load dataset
    file_path = r"C:\Users\gvaas\OneDrive\Desktop\Python\drug200.csv"
    try:
        df = pd.read_csv(file_path)
    except FileNotFoundError:
        print(f"Error: Could not find the dataset at {file_path}")
        return

    print("Dataset loaded successfully.")
    
    # Preprocessing
    # Categorical columns: Sex, BP, Cholesterol need to be encoded
    label_encoders = {}
    for col in ['Sex', 'BP', 'Cholesterol', 'Drug']:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col])
        label_encoders[col] = le

    X = df.drop('Drug', axis=1)
    y = df['Drug']

    # The user mentioned "considering few data sets", which could mean trying different train-test split ratios
    splits = [0.2, 0.3, 0.4]

    print("\n--- Naive Bayes Classifier Accuracy ---")
    for test_size in splits:
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=42)
        
        # Initialize and train Naive Bayes Classifier
        nb_classifier = GaussianNB()
        nb_classifier.fit(X_train, y_train)
        
        # Predict and compute accuracy
        y_pred = nb_classifier.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        print(f"Accuracy with test set size {test_size * 100}%: {accuracy * 100:.2f}%")

if __name__ == "__main__":
    main()
