pragma solidity ^0.7.0;

contract Hash {
    struct Registry {
        mapping(address=>uint256) statusDID;
        mapping(bytes32=>uint256) statusVC;
    }
    mapping(address=>Registry) registry;

    event DID(address indexed _issuer, address indexed _did, uint256 indexed _status);
    event VC(address indexed _issuer, bytes32 indexed _hash, uint256 indexed _status);

    function getStatusDID(address _did, address _issuer) external view returns (uint256) {
        return registry[_issuer].statusDID[_did];
    }

    function setStatusDID(address _did, uint256 _status) external {
        registry[msg.sender].statusDID[_did] = _status;
        emit DID(msg.sender, _did, _status);
    }

    function getStatusVC(bytes32 _hash, address _issuer) external view returns (uint256) {
        return registry[_issuer].statusVC[_hash];
    }

    function setStatusVC(bytes32 _hash, uint256 _status) external {
        registry[msg.sender].statusVC[_hash] = _status;
        emit VC(msg.sender, _hash, _status);
    }
}
