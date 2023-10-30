import React from "react";

export function Collection({ collectionAddress, name, symbol, nfts, mintNft }) {
    return (
        <div>
            <h5>Collection {name} {symbol} ({collectionAddress})</h5>
            {nfts.map((n, index) => {
                return <img alt={n.address} key={index} src={n.tokenUri} />
            })}

            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    mintNft(collectionAddress);
                }}
            >
                <div className="form-group">
                    <input className="btn btn-secondary" type="submit" value="Mint"/>
                </div>
            </form>
        </div>
    );
}
