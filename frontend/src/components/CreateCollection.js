import React from "react";

export function CreateCollection({ createCollection }) {
    return (
        <div>
            <h4>Create Collection</h4>
            <form
                onSubmit={(event) => {
                    event.preventDefault();

                    const formData = new FormData(event.target);
                    const name = formData.get("name");
                    const symbol = formData.get("symbol");

                    if (name && symbol) {
                        createCollection(name, symbol);
                    }
                }}
            >
                <div className="form-group">
                    <label>Collection name</label>
                    <input className="form-control" type="text" name="name" required/>
                </div>
                <div className="form-group">
                    <label>Collection symbol</label>
                    <input className="form-control" type="text" name="symbol" required/>
                </div>
                <div className="form-group">
                    <input className="btn btn-primary" type="submit" value="Create"/>
                </div>
            </form>
        </div>
    );
}
