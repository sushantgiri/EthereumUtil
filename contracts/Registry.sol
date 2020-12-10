pragma solidity ^0.7.0;

contract Registry {
    struct Store {
        mapping(address=>uint256) statusDID;
        mapping(bytes32=>uint256) statusVC;
    }
    mapping(address=>Store) registry;

    event DID(address indexed _issuer, address indexed _did, uint256 indexed _revokeCode);
    event VC(address indexed _issuer, bytes32 indexed _hash, uint256 indexed _revokeCode);

    function GetRevokeCodeDID(address _did, address _issuer) external view returns (uint256) {
        return registry[_issuer].statusDID[_did];
    }

    function SetRevokeCodeDID(address _did, uint256 _revokeCode) external {
        require(_revokeCode > 0 && registry[msg.sender].statusDID[_did] == 0);
        registry[msg.sender].statusDID[_did] = _revokeCode;
        emit DID(msg.sender, _did, _revokeCode);
    }

    function GetRevokeCodeVC(bytes32 _hash, address _issuer) external view returns (uint256) {
        return registry[_issuer].statusVC[_hash];
    }

    function SetRevokeCodeVC(bytes32 _hash, uint256 _revokeCode) external {
        require(_revokeCode > 0 && registry[msg.sender].statusVC[_hash] == 0);
        registry[msg.sender].statusVC[_hash] = _revokeCode;
        emit VC(msg.sender, _hash, _revokeCode);
    }
}
